const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'access-control-allow-origin': '*'
};

const ALLOWED_INQUIRY_TYPES = new Set([
  'Brand or Partnership',
  'Agency or Representation',
  'Casting or Modeling',
  'Press, PR, or Events',
  'Creative Collaboration'
]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function clean(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

async function readJson(request) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 30_000) throw new Error('Request is too large.');
  return request.json();
}

async function readLargeJson(request) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 1_800_000) throw new Error('The image is too large after optimization.');
  return request.json();
}

function professionalEmail(request) {
  return clean(request.headers.get('cf-access-authenticated-user-email'), 254).toLowerCase();
}

async function createAccessRequest(request, env) {
  const data = await readJson(request);
  if (data._gotcha) return json({ message: 'Request received.' }, 202);

  const row = {
    id: crypto.randomUUID(),
    firstName: clean(data.first_name, 80),
    lastName: clean(data.last_name, 80),
    email: clean(data.email, 254).toLowerCase(),
    company: clean(data.company, 160),
    role: clean(data.role, 160),
    type: clean(data.inquiry_type, 80),
    reason: clean(data.message, 4000)
  };

  if (!row.firstName || !row.lastName || !validEmail(row.email) || !row.company ||
      !row.role || !ALLOWED_INQUIRY_TYPES.has(row.type) || row.reason.length < 10) {
    return json({ error: 'Please complete every required professional field.' }, 400);
  }

  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM access_requests WHERE email = ? AND created_at > datetime('now','-24 hours')"
  ).bind(row.email).first();
  if ((recent?.count || 0) >= 3) {
    return json({ error: 'We already received your request. Please allow time for review.' }, 429);
  }

  await env.DB.prepare(
    `INSERT INTO access_requests
      (id, first_name, last_name, email, company, professional_role, inquiry_type, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(row.id, row.firstName, row.lastName, row.email, row.company, row.role, row.type, row.reason).run();

  return json({
    message: 'Access request received. The business desk will review your professional information.'
  }, 201);
}

async function createInquiry(request, env) {
  const data = await readJson(request);
  if (data._gotcha) return json({ message: 'Inquiry received.' }, 202);

  const row = {
    id: crypto.randomUUID(),
    name: clean(data.contact_name, 160),
    email: clean(data.email, 254).toLowerCase(),
    company: clean(data.company, 160),
    type: clean(data.inquiry_type, 80),
    project: clean(data.project_name, 200),
    budget: clean(data.budget, 100),
    dates: clean(data.dates, 200),
    usage: clean(data.usage_rights, 500),
    brief: clean(data.message, 6000)
  };

  if (!row.name || !validEmail(row.email) || !row.company ||
      !ALLOWED_INQUIRY_TYPES.has(row.type) || !row.project || row.brief.length < 10) {
    return json({ error: 'Please complete the required project information.' }, 400);
  }

  await env.DB.prepare(
    `INSERT INTO inquiries
      (id, contact_name, email, company, inquiry_type, project_name, budget_range, proposed_dates, usage_rights, project_brief)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(row.id, row.name, row.email, row.company, row.type, row.project, row.budget, row.dates, row.usage, row.brief).run();

  return json({ message: 'Your brief has been sent to the YourFavAlien business desk.' }, 201);
}

async function portalResponse(request, env) {
  const email = professionalEmail(request);
  if (!email) return json({ error: 'Secure partner authentication is required.' }, 401);

  const member = await env.DB.prepare(
    "SELECT contact_name, company, access_level, status FROM partners WHERE email = ? LIMIT 1"
  ).bind(email).first();
  if (!member || member.status !== 'active') {
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>Access pending</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0c0f;color:#ece9e2;font:16px Arial}main{max-width:560px;padding:40px}h1{font:56px Georgia;margin:0 0 20px}p{line-height:1.6;color:#b9bec6}a{color:#d8ff54}</style><main><h1>Access is not active yet.</h1><p>Your professional email was verified, but it has not been approved for the private Headquarters. Submit an access request or contact the business desk.</p><a href="/">Return to reception</a></main>',
      { status: 403, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } }
    );
  }

  await env.DB.prepare("UPDATE partners SET last_seen_at = CURRENT_TIMESTAMP WHERE email = ?").bind(email).run();
  const assetRequest = new Request(new URL('/', request.url), request);
  const page = await env.ASSETS.fetch(assetRequest);
  const bodyClass = member.access_level === 'admin' ? 'portal-mode admin-mode' : 'portal-mode';
  return new HTMLRewriter()
    .on('body', { element(element) { element.setAttribute('class', bodyClass); } })
    .on('#portal', { element(element) { element.removeAttribute('hidden'); } })
    .on('#portalCompany', { element(element) { element.setInnerContent(member.company); } })
    .transform(page);
}

async function privateSession(request, env) {
  const email = professionalEmail(request);
  if (!email) return json({ error: 'Authentication required.' }, 401);
  const partner = await env.DB.prepare(
    "SELECT contact_name, company, access_level, status FROM partners WHERE email = ? LIMIT 1"
  ).bind(email).first();
  if (!partner || partner.status !== 'active') return json({ error: 'Access is not active.' }, 403);
  return json({ email, ...partner });
}

async function partnerAnalytics(request, env) {
  if (new URL(request.url).hostname !== 'partners.yourfavalien.site') return json({ error: 'Partner access required.' }, 403);
  const email = professionalEmail(request);
  if (!email) return json({ error: 'Authentication required.' }, 401);
  const partner = await env.DB.prepare("SELECT status FROM partners WHERE email = ? LIMIT 1").bind(email).first();
  if (!partner || partner.status !== 'active') return json({ error: 'Active partner access required.' }, 403);
  const response = await fetch('https://yourfavalien-analytics.aydenmtz54.workers.dev/api/analytics', { headers: { Accept: 'application/json' } });
  if (!response.ok) return json({ error: 'Current analytics are temporarily unavailable.' }, 502);
  return new Response(await response.text(), { status: 200, headers: JSON_HEADERS });
}

async function requireAdmin(request, env) {
  if (new URL(request.url).hostname !== 'partners.yourfavalien.site') return { error: json({ error: 'Administrator access requires the protected headquarters.' }, 403) };
  const email = professionalEmail(request);
  if (!email) return { error: json({ error: 'Authentication required.' }, 401) };
  const partner = await env.DB.prepare("SELECT access_level, status FROM partners WHERE email = ? LIMIT 1").bind(email).first();
  if (!partner || partner.status !== 'active' || partner.access_level !== 'admin') return { error: json({ error: 'Administrator access required.' }, 403) };
  return { email };
}

async function adminDashboard(request, env) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  const [access, inquiries, partners, partnerList, settings] = await Promise.all([
    env.DB.prepare("SELECT id, first_name, last_name, email, company, professional_role, inquiry_type, reason, created_at FROM access_requests WHERE status = 'pending' ORDER BY created_at DESC LIMIT 50").all(),
    env.DB.prepare("SELECT id, contact_name, email, company, inquiry_type, project_name, project_brief, created_at FROM inquiries WHERE status IN ('new','reviewing') ORDER BY created_at DESC LIMIT 50").all(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM partners WHERE status = 'active'").first(),
    env.DB.prepare("SELECT id, email, contact_name, company, professional_role, access_level, status, last_seen_at, created_at FROM partners ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'suspended' THEN 1 ELSE 2 END, created_at DESC").all(),
    env.DB.prepare("SELECT setting_key, setting_value FROM site_settings").all()
  ]);
  return json({ accessRequests: access.results || [], inquiries: inquiries.results || [], activePartners: partners?.count || 0, partners: partnerList.results || [], content: Object.fromEntries((settings.results || []).map(row => [row.setting_key, row.setting_value])) });
}

async function updatePartnerAccess(request, env, id) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  const data = await readJson(request);
  const statusMap = { suspend: 'suspended', reactivate: 'active', revoke: 'revoked' };
  const status = statusMap[data.action];
  if (!status) return json({ error: 'Invalid partner action.' }, 400);
  const target = await env.DB.prepare("SELECT email, access_level FROM partners WHERE id = ?").bind(id).first();
  if (!target) return json({ error: 'Partner account not found.' }, 404);
  if (target.access_level === 'admin') return json({ error: 'The owner administrator account cannot be changed here.' }, 400);
  await env.DB.batch([
    env.DB.prepare("UPDATE partners SET status = ? WHERE id = ?").bind(status, id),
    env.DB.prepare("INSERT INTO audit_log (id, actor_email, action, entity_type, entity_id, details) VALUES (?, ?, ?, 'partner', ?, ?)").bind(crypto.randomUUID(), auth.email, data.action, id, target.email)
  ]);
  return json({ message: `Partner access ${status}.` });
}

const EDITABLE_SETTINGS = new Set(['hero_title','hero_copy','profile_title','profile_copy','business_email','hero_image','login_image']);

async function publicContent(env) {
  const settings = await env.DB.prepare("SELECT setting_key, setting_value FROM site_settings").all();
  return json({ content: Object.fromEntries((settings.results || []).map(row => [row.setting_key, row.setting_value])) });
}

async function saveSiteContent(request, env) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  const data = await readLargeJson(request);
  const entries = Object.entries(data.content || {}).filter(([key, value]) => EDITABLE_SETTINGS.has(key) && typeof value === 'string');
  if (!entries.length) return json({ error: 'No editable content was supplied.' }, 400);
  for (const [key, value] of entries) {
    const limit = key.endsWith('_image') ? 1_500_000 : 4000;
    if (value.length > limit) return json({ error: `${key.replaceAll('_', ' ')} is too large.` }, 400);
    if (key.endsWith('_image') && value && !/^data:image\/(?:jpeg|png|webp);base64,/i.test(value)) return json({ error: 'Unsupported image format.' }, 400);
  }
  await env.DB.batch(entries.map(([key, value]) => env.DB.prepare("INSERT INTO site_settings (setting_key, setting_value, updated_by, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value, updated_by=excluded.updated_by, updated_at=CURRENT_TIMESTAMP").bind(key, value.trim(), auth.email)));
  await env.DB.prepare("INSERT INTO audit_log (id, actor_email, action, entity_type, details) VALUES (?, ?, 'updated', 'site_content', ?)").bind(crypto.randomUUID(), auth.email, JSON.stringify(entries.map(([key]) => key))).run();
  return json({ message: 'Website changes published.' });
}

async function listPortfolio(request, env, admin = false) {
  if (new URL(request.url).hostname !== 'partners.yourfavalien.site') return json({ error: 'Partner access required.' }, 403);
  const email = professionalEmail(request);
  if (!email) return json({ error: 'Authentication required.' }, 401);
  const partner = await env.DB.prepare("SELECT access_level, status FROM partners WHERE email = ? LIMIT 1").bind(email).first();
  if (!partner || partner.status !== 'active' || (admin && partner.access_level !== 'admin')) return json({ error: admin ? 'Administrator access required.' : 'Active partner access required.' }, 403);
  const rows = await env.DB.prepare("SELECT id, title, category, description, image_path, credit, is_featured, sort_order, published_at FROM portfolio_items WHERE published_at IS NOT NULL ORDER BY is_featured DESC, sort_order ASC, published_at DESC").all();
  return json({ items: rows.results || [] });
}

async function createPortfolioItem(request, env) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  const data = await readLargeJson(request);
  const title = clean(data.title, 160);
  const category = clean(data.category, 80);
  const description = clean(data.description, 800);
  const credit = clean(data.credit, 200);
  const imagePath = String(data.image || '');
  if (!title || !category || !imagePath || !/^data:image\/(?:jpeg|png|webp);base64,/i.test(imagePath) || imagePath.length > 1_500_000) return json({ error: 'Add a title, category, and supported portfolio image.' }, 400);
  const id = crypto.randomUUID();
  const order = await env.DB.prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM portfolio_items").first();
  await env.DB.prepare("INSERT INTO portfolio_items (id, title, category, description, image_path, credit, is_private, is_featured, sort_order, published_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP)").bind(id, title, category, description, imagePath, credit, data.is_featured ? 1 : 0, order?.next_order || 0).run();
  await env.DB.prepare("INSERT INTO audit_log (id, actor_email, action, entity_type, entity_id) VALUES (?, ?, 'published', 'portfolio_item', ?)").bind(crypto.randomUUID(), auth.email, id).run();
  return json({ message: 'Selected work published.', id }, 201);
}

async function deletePortfolioItem(request, env, id) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  const result = await env.DB.prepare("DELETE FROM portfolio_items WHERE id = ?").bind(id).run();
  if (!result.meta?.changes) return json({ error: 'Portfolio item not found.' }, 404);
  await env.DB.prepare("INSERT INTO audit_log (id, actor_email, action, entity_type, entity_id) VALUES (?, ?, 'deleted', 'portfolio_item', ?)").bind(crypto.randomUUID(), auth.email, id).run();
  return json({ message: 'Selected work removed.' });
}

async function reviewAccess(request, env, id) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  const data = await readJson(request);
  if (!['approve', 'decline'].includes(data.action)) return json({ error: 'Invalid review action.' }, 400);
  const item = await env.DB.prepare("SELECT * FROM access_requests WHERE id = ? AND status = 'pending'").bind(id).first();
  if (!item) return json({ error: 'Pending request not found.' }, 404);
  if (data.action === 'approve') {
    const levelMap = { 'Agency or Representation': 'agency', 'Casting or Modeling': 'casting', 'Press, PR, or Events': 'press', 'Creative Collaboration': 'creative' };
    const level = levelMap[item.inquiry_type] || 'partner';
    await env.DB.batch([
      env.DB.prepare("INSERT INTO partners (id, email, contact_name, company, professional_role, access_level, status, access_request_id) VALUES (?, ?, ?, ?, ?, ?, 'active', ?) ON CONFLICT(email) DO UPDATE SET contact_name=excluded.contact_name, company=excluded.company, professional_role=excluded.professional_role, access_level=excluded.access_level, status='active', access_request_id=excluded.access_request_id").bind(crypto.randomUUID(), item.email, `${item.first_name} ${item.last_name}`, item.company, item.professional_role, level, item.id),
      env.DB.prepare("UPDATE access_requests SET status='approved', reviewed_by=?, reviewed_at=CURRENT_TIMESTAMP WHERE id=?").bind(auth.email, id),
      env.DB.prepare("INSERT INTO audit_log (id, actor_email, action, entity_type, entity_id) VALUES (?, ?, 'approved', 'access_request', ?)").bind(crypto.randomUUID(), auth.email, id)
    ]);
  } else {
    await env.DB.batch([
      env.DB.prepare("UPDATE access_requests SET status='declined', reviewed_by=?, reviewed_at=CURRENT_TIMESTAMP WHERE id=?").bind(auth.email, id),
      env.DB.prepare("INSERT INTO audit_log (id, actor_email, action, entity_type, entity_id) VALUES (?, ?, 'declined', 'access_request', ?)").bind(crypto.randomUUID(), auth.email, id)
    ]);
  }
  return json({ message: `Request ${data.action}d.` });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isPartnerHost = url.hostname === 'partners.yourfavalien.site';
    const isStaticAsset = /\.(?:css|js|png|jpe?g|gif|webp|svg|ico|txt|pdf|woff2?)$/i.test(url.pathname);
    try {
      if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
        return new Response(null, { status: 204, headers: { allow: 'GET, POST, OPTIONS', 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'Content-Type, Accept' } });
      }
      if (url.pathname === '/api/access-requests' && request.method === 'POST') {
        return createAccessRequest(request, env);
      }
      if (url.pathname === '/api/inquiries' && request.method === 'POST') {
        return createInquiry(request, env);
      }
      if (url.pathname === '/api/session' && request.method === 'GET') {
        return privateSession(request, env);
      }
      if (url.pathname === '/api/partner-analytics' && request.method === 'GET') {
        return partnerAnalytics(request, env);
      }
      if (url.pathname === '/api/portfolio' && request.method === 'GET') {
        return listPortfolio(request, env, false);
      }
      if (url.pathname === '/api/content' && request.method === 'GET') {
        return publicContent(env);
      }
      if (url.pathname === '/api/admin/dashboard' && request.method === 'GET') {
        return adminDashboard(request, env);
      }
      if (url.pathname === '/api/admin/content' && request.method === 'POST') {
        return saveSiteContent(request, env);
      }
      if (url.pathname === '/api/admin/portfolio' && request.method === 'GET') {
        return listPortfolio(request, env, true);
      }
      if (url.pathname === '/api/admin/portfolio' && request.method === 'POST') {
        return createPortfolioItem(request, env);
      }
      const portfolioMatch = url.pathname.match(/^\/api\/admin\/portfolio\/([^/]+)$/);
      if (portfolioMatch && request.method === 'DELETE') {
        return deletePortfolioItem(request, env, decodeURIComponent(portfolioMatch[1]));
      }
      const partnerMatch = url.pathname.match(/^\/api\/admin\/partners\/([^/]+)$/);
      if (partnerMatch && request.method === 'POST') {
        return updatePartnerAccess(request, env, decodeURIComponent(partnerMatch[1]));
      }
      const reviewMatch = url.pathname.match(/^\/api\/admin\/access-requests\/([^/]+)$/);
      if (reviewMatch && request.method === 'POST') {
        return reviewAccess(request, env, decodeURIComponent(reviewMatch[1]));
      }
      if (isPartnerHost && isStaticAsset) {
        return env.ASSETS.fetch(request);
      }
      if (isPartnerHost) {
        return portalResponse(request, env);
      }
      if (url.pathname.startsWith('/api/')) return json({ error: 'Not found.' }, 404);
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error('Headquarters request failed', error);
      return json({ error: 'The business desk is temporarily unavailable. Please try again.' }, 500);
    }
  }
};
