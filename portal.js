(() => {
  const body = document.body;
  const apiBase = location.hostname === 'yourfavalien.site' ? 'https://yourfavalien-business-headquarters.aydenmtz54.workers.dev' : '';
  let editableContent = {};
  const mobileNav = document.getElementById('mobileNav');
  const menuButton = document.getElementById('menuButton');

  const editorGrid = document.querySelector('#contentEditor .editor-grid');
  if (editorGrid && !document.querySelector('#contentEditor [name="availability_status"]')) {
    const profileTitle = document.querySelector('#contentEditor [name="profile_title"]')?.closest('label');
    const statusField = document.createElement('label');
    statusField.innerHTML = '<span>Opportunity status</span><input name="availability_status" maxlength="120" list="availabilityOptions" placeholder="Accepting selected opportunities"><datalist id="availabilityOptions"><option value="Accepting all opportunities"><option value="Accepting selected opportunities"><option value="Currently reviewing select opportunities"><option value="Open to partnerships and representation"><option value="Bookings temporarily paused"></datalist><small>This appears beneath the homepage buttons.</small>';
    editorGrid.insertBefore(statusField, profileTitle || null);
  }

  function applySiteContent(content = {}) {
    Object.entries(content).forEach(([key, value]) => {
      if (!value) return;
      document.querySelectorAll(`[data-content-text="${key}"]`).forEach(element => { element.textContent = value; });
      document.querySelectorAll(`[data-content-image="${key}"]`).forEach(element => { element.src = value; });
      document.querySelectorAll(`[data-content-email="${key}"]`).forEach(element => { element.textContent = value; element.href = `mailto:${value}`; });
    });
  }

  async function loadPublicContent() {
    try {
      const response = await fetch(`${apiBase}/api/content`, { headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      const data = await response.json();
      editableContent = data.content || {};
      applySiteContent(editableContent);
    } catch (_) {}
  }
  loadPublicContent();

  function openDialog(id) {
    const dialog = document.getElementById(id);
    if (!dialog) return;
    document.querySelectorAll('dialog[open]').forEach(item => item.close());
    dialog.showModal();
    body.classList.add('dialog-open');
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    dialog.close();
    if (!document.querySelector('dialog[open]')) body.classList.remove('dialog-open');
  }

  document.addEventListener('click', event => {
    const open = event.target.closest('[data-open-dialog]');
    const close = event.target.closest('[data-close-dialog]');
    const swap = event.target.closest('[data-switch-dialog]');
    const department = event.target.closest('[data-path]');

    if (open) openDialog(open.dataset.openDialog);
    if (close) closeDialog(close.closest('dialog'));
    if (swap) openDialog(swap.dataset.switchDialog);
    if (department) {
      const path = department.dataset.path;
      const accessPath = document.getElementById('accessPath');
      const inquiryPath = document.getElementById('inquiryPath');
      if (accessPath) accessPath.value = path;
      if (inquiryPath) inquiryPath.value = path;
      openDialog('inquiryDialog');
    }
  });

  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => {
      if (event.target === dialog) closeDialog(dialog);
    });
    dialog.addEventListener('close', () => {
      if (!document.querySelector('dialog[open]')) body.classList.remove('dialog-open');
    });
  });

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
    });
    mobileNav.querySelectorAll('a,button').forEach(item => item.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    }));
  }

  async function submitForm(form, endpoint) {
    if (!form.reportValidity()) return;
    const button = form.querySelector('[type="submit"],button:not([type])');
    const status = form.querySelector('.form-status');
    const original = button.innerHTML;
    button.disabled = true;
    button.textContent = 'Sending…';
    status.textContent = '';
    status.className = 'form-status';

    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Unable to submit right now.');
      status.textContent = result.message || 'Received. The business desk will review your submission.';
      status.classList.add('success');
      form.reset();
    } catch (error) {
      status.textContent = error.message || 'Unable to submit right now. Please try again.';
      status.classList.add('error');
    } finally {
      button.disabled = false;
      button.innerHTML = original;
    }
  }

  const accessForm = document.getElementById('accessForm');
  const inquiryForm = document.getElementById('inquiryForm');
  const portalInquiryForm = document.getElementById('portalInquiryForm');
  if (accessForm) accessForm.addEventListener('submit', event => {
    event.preventDefault();
    submitForm(accessForm, `${apiBase}/api/access-requests`);
  });
  if (inquiryForm) inquiryForm.addEventListener('submit', event => {
    event.preventDefault();
    submitForm(inquiryForm, `${apiBase}/api/inquiries`);
  });
  if (portalInquiryForm) portalInquiryForm.addEventListener('submit', event => {
    event.preventDefault();
    submitForm(portalInquiryForm, '/api/inquiries');
  });

  document.querySelectorAll('[data-portal-view]').forEach(button => {
    button.addEventListener('click', () => {
      const view = button.dataset.portalView;
      document.querySelectorAll('.portal-view').forEach(panel => {
        panel.hidden = panel.dataset.view !== view;
      });
      document.querySelectorAll('.portal-sidebar [data-portal-view]').forEach(item => {
        item.classList.toggle('active', item.dataset.portalView === view);
      });
      const isOwnerPreview = body.classList.contains('admin-mode') && view !== 'admin';
      body.classList.toggle('partner-preview-mode', isOwnerPreview);
      const overviewReturn = document.getElementById('portalOverviewReturn');
      if (overviewReturn) overviewReturn.hidden = view === 'overview' || view === 'admin';
      if (view === 'audience') loadPartnerAnalytics();
      if (view === 'work') loadPartnerPortfolio();
      document.querySelector('.portal-main')?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  let analyticsLoaded = false;
  async function loadPartnerAnalytics() {
    if (analyticsLoaded) return;
    const status = document.getElementById('analyticsStatus');
    if (!status) return;
    try {
      const response = await fetch('/api/partner-analytics', { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analytics are temporarily unavailable.');
      const number = new Intl.NumberFormat('en-US');
      const metrics = {
        'tiktok.followers': data.platforms.tiktok.followers,
        'tiktok.engagementRate': `${data.platforms.tiktok.engagementRate}%`,
        'tiktok.impressions': data.platforms.tiktok.impressions,
        'tiktok.averageViews': data.platforms.tiktok.averageViews,
        'instagram.followers': data.platforms.instagram.followers,
        'instagram.engagementRate': `${data.platforms.instagram.engagementRate}%`,
        'instagram.impressions': data.platforms.instagram.impressions,
        'instagram.reach30d': data.platforms.instagram.reach30d,
        'facebook.followers': data.platforms.facebook.followers,
        'facebook.engagementRate': `${data.platforms.facebook.engagementRate}%`,
        'facebook.impressions': data.platforms.facebook.impressions,
        'facebook.reach30d': data.platforms.facebook.reach30d
      };
      Object.entries(metrics).forEach(([key, value]) => {
        const element = document.querySelector(`[data-partner-metric="${key}"]`);
        if (element) element.textContent = typeof value === 'number' ? number.format(value) : value;
      });
      status.textContent = data.source === 'live' ? 'Live connected analytics' : 'Latest verified analytics';
      document.getElementById('analyticsUpdated').textContent = `Updated ${new Date(data.updatedAt).toLocaleString()}`;
      analyticsLoaded = true;
    } catch (error) {
      status.textContent = error.message;
    }
  }

  document.querySelectorAll('[data-print-portal]').forEach(button => button.addEventListener('click', () => window.print()));

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  async function loadAdmin() {
    if (!body.classList.contains('admin-mode')) return;
    const accessList = document.getElementById('adminAccessRequests');
    const inquiryList = document.getElementById('adminInquiries');
    const partnerList = document.getElementById('adminPartners');
    try {
      const response = await fetch('/api/admin/dashboard', { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load the control room.');
      const totals = document.querySelectorAll('#adminSummary strong');
      [data.accessRequests.length, data.inquiries.length, data.activePartners].forEach((value, index) => { if (totals[index]) totals[index].textContent = value; });
      editableContent = { ...editableContent, ...(data.content || {}) };
      const editor = document.getElementById('contentEditor');
      if (editor) {
        ['hero_title','hero_copy','availability_status','profile_title','profile_copy','business_email'].forEach(key => { if (editor.elements[key]) editor.elements[key].value = editableContent[key] || document.querySelector(`[data-content-text="${key}"],[data-content-email="${key}"]`)?.textContent?.trim() || ''; });
        if (editableContent.hero_image) document.getElementById('heroImagePreview').src = editableContent.hero_image;
        if (editableContent.login_image) document.getElementById('loginImagePreview').src = editableContent.login_image;
      }
      accessList.innerHTML = data.accessRequests.length ? data.accessRequests.map(item => `<article class="admin-item"><header><strong>${escapeHtml(item.first_name)} ${escapeHtml(item.last_name)}</strong><small>${escapeHtml(item.inquiry_type)}</small></header><p>${escapeHtml(item.company)} · ${escapeHtml(item.professional_role)}<br>${escapeHtml(item.email)}</p><p>${escapeHtml(item.reason)}</p><div class="admin-item-actions"><button data-admin-action="approve" data-id="${escapeHtml(item.id)}">Approve</button><button data-admin-action="decline" data-id="${escapeHtml(item.id)}">Decline</button></div></article>`).join('') : '<p>No pending requests.</p>';
      inquiryList.innerHTML = data.inquiries.length ? data.inquiries.map(item => `<article class="admin-item"><header><strong>${escapeHtml(item.project_name)}</strong><small>${escapeHtml(item.inquiry_type)}</small></header><p>${escapeHtml(item.company)} · ${escapeHtml(item.contact_name)}<br>${escapeHtml(item.email)}</p><p>${escapeHtml(item.project_brief)}</p></article>`).join('') : '<p>No new inquiries.</p>';
      if (partnerList) partnerList.innerHTML = data.partners.length ? data.partners.map(item => `<article class="admin-item partner-account"><header><strong>${escapeHtml(item.contact_name)}</strong><span class="partner-status ${escapeHtml(item.status)}">${escapeHtml(item.status)}</span></header><p>${escapeHtml(item.company)} · ${escapeHtml(item.professional_role || item.access_level)}<br>${escapeHtml(item.email)}</p><small>${item.last_seen_at ? `Last visit: ${escapeHtml(new Date(item.last_seen_at).toLocaleString())}` : 'No portal visit recorded yet'}</small>${item.access_level === 'admin' ? '<p class="owner-protected">Owner administrator · protected</p>' : `<div class="admin-item-actions">${item.status === 'active' ? `<button data-partner-action="suspend" data-id="${escapeHtml(item.id)}">Suspend</button>` : `<button data-partner-action="reactivate" data-id="${escapeHtml(item.id)}">Reactivate</button>`}<button data-partner-action="revoke" data-id="${escapeHtml(item.id)}">Revoke</button></div>`}</article>`).join('') : '<p>No partner accounts.</p>';
    } catch (error) {
      accessList.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
      inquiryList.innerHTML = '';
    }
  }

  let partnerPortfolioLoaded = false;
  async function loadPartnerPortfolio(force = false) {
    if (partnerPortfolioLoaded && !force) return;
    const gallery = document.getElementById('partnerPortfolio');
    if (!gallery) return;
    try {
      const response = await fetch('/api/portfolio', { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Selected work is temporarily unavailable.');
      gallery.innerHTML = data.items.length ? data.items.map(item => `<figure class="portfolio-piece"><img src="${item.image_path}" alt="${escapeHtml(item.title)}"><figcaption><small>${escapeHtml(item.category)}</small><strong>${escapeHtml(item.title)}</strong>${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}${item.credit ? `<span>${escapeHtml(item.credit)}</span>` : ''}</figcaption></figure>`).join('') : '<div class="portfolio-empty"><strong>No selected work has been published yet.</strong><p>The owner can add the first portfolio images from the Selected Work workspace in the Control Room.</p></div>';
      partnerPortfolioLoaded = true;
    } catch (error) { gallery.innerHTML = `<p>${escapeHtml(error.message)}</p>`; }
  }

  async function loadAdminPortfolio() {
    const list = document.getElementById('adminPortfolio');
    if (!list || !body.classList.contains('admin-mode')) return;
    try {
      const response = await fetch('/api/admin/portfolio', { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load selected work.');
      list.innerHTML = data.items.length ? data.items.map(item => `<article class="portfolio-admin-item"><img src="${item.image_path}" alt=""><div><small>${escapeHtml(item.category)}</small><strong>${escapeHtml(item.title)}</strong>${item.credit ? `<span>${escapeHtml(item.credit)}</span>` : ''}</div><button data-portfolio-delete data-id="${escapeHtml(item.id)}">Remove</button></article>`).join('') : '<p>You have not published any selected work yet.</p>';
    } catch (error) { list.innerHTML = `<p>${escapeHtml(error.message)}</p>`; }
  }

  function optimizeImage(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve('');
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error('Choose a JPG, PNG, or WebP image.'));
      const image = new Image();
      image.onload = () => {
        const max = 1600;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(image.src);
        const value = canvas.toDataURL('image/webp', .8);
        if (value.length > 1450000) return reject(new Error('That photo is still too large. Please choose a smaller image.'));
        resolve(value);
      };
      image.onerror = () => reject(new Error('That image could not be opened.'));
      image.src = URL.createObjectURL(file);
    });
  }

  const contentEditor = document.getElementById('contentEditor');
  if (contentEditor) {
    [['hero_image_upload','heroImagePreview'],['login_image_upload','loginImagePreview']].forEach(([name, previewId]) => {
      contentEditor.elements[name].addEventListener('change', async () => {
        const file = contentEditor.elements[name].files[0];
        if (!file) return;
        try { document.getElementById(previewId).src = await optimizeImage(file); } catch (error) { document.getElementById('editorStatus').textContent = error.message; }
      });
    });
    contentEditor.addEventListener('submit', async event => {
      event.preventDefault();
      const button = contentEditor.querySelector('[type="submit"]');
      const status = document.getElementById('editorStatus');
      button.disabled = true; status.textContent = 'Publishing…';
      try {
        const content = {};
        ['hero_title','hero_copy','availability_status','profile_title','profile_copy','business_email'].forEach(key => { content[key] = contentEditor.elements[key].value.trim(); });
        const heroFile = contentEditor.elements.hero_image_upload.files[0];
        const loginFile = contentEditor.elements.login_image_upload.files[0];
        if (heroFile) content.hero_image = await optimizeImage(heroFile);
        if (loginFile) content.login_image = await optimizeImage(loginFile);
        const response = await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to publish changes.');
        editableContent = { ...editableContent, ...content };
        applySiteContent(editableContent);
        status.textContent = 'Published successfully.';
        contentEditor.elements.hero_image_upload.value = '';
        contentEditor.elements.login_image_upload.value = '';
      } catch (error) { status.textContent = error.message; }
      finally { button.disabled = false; }
    });
  }

  const portfolioForm = document.getElementById('portfolioForm');
  if (portfolioForm) {
    portfolioForm.elements.portfolio_image.addEventListener('change', async () => {
      const file = portfolioForm.elements.portfolio_image.files[0];
      if (!file) return;
      const status = portfolioForm.querySelector('.form-status');
      try { document.getElementById('portfolioImagePreview').src = await optimizeImage(file); status.textContent = ''; }
      catch (error) { status.textContent = error.message; }
    });
    portfolioForm.addEventListener('submit', async event => {
      event.preventDefault();
      const button = portfolioForm.querySelector('[type="submit"]');
      const status = portfolioForm.querySelector('.form-status');
      button.disabled = true; status.textContent = 'Publishing…';
      try {
        const file = portfolioForm.elements.portfolio_image.files[0];
        if (!file) throw new Error('Choose an image first.');
        const payload = { title: portfolioForm.elements.title.value.trim(), category: portfolioForm.elements.category.value, description: portfolioForm.elements.description.value.trim(), credit: portfolioForm.elements.credit.value.trim(), is_featured: portfolioForm.elements.is_featured.checked, image: await optimizeImage(file) };
        const response = await fetch('/api/admin/portfolio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to publish selected work.');
        portfolioForm.reset(); document.getElementById('portfolioImagePreview').src = 'yourfavalien-banner.png'; status.textContent = 'Selected work published.'; partnerPortfolioLoaded = false; await loadAdminPortfolio();
      } catch (error) { status.textContent = error.message; }
      finally { button.disabled = false; }
    });
  }

  document.addEventListener('click', async event => {
    const refresh = event.target.closest('[data-admin-refresh]');
    const action = event.target.closest('[data-admin-action]');
    const partnerAction = event.target.closest('[data-partner-action]');
    const portfolioDelete = event.target.closest('[data-portfolio-delete]');
    const panelButton = event.target.closest('[data-admin-panel]');
    if (panelButton) {
      const panel = panelButton.dataset.adminPanel;
      document.querySelectorAll('[data-admin-workspace]').forEach(workspace => { workspace.hidden = workspace.dataset.adminWorkspace !== panel; });
      document.querySelectorAll('[data-admin-panel]').forEach(button => button.classList.toggle('active', button.dataset.adminPanel === panel));
    }
    if (refresh) loadAdmin();
    if (partnerAction) {
      partnerAction.disabled = true;
      const response = await fetch(`/api/admin/partners/${encodeURIComponent(partnerAction.dataset.id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: partnerAction.dataset.partnerAction }) });
      if (response.ok) loadAdmin(); else partnerAction.disabled = false;
    }
    if (portfolioDelete && confirm('Remove this item from Selected Work?')) {
      portfolioDelete.disabled = true;
      const response = await fetch(`/api/admin/portfolio/${encodeURIComponent(portfolioDelete.dataset.id)}`, { method: 'DELETE' });
      if (response.ok) { partnerPortfolioLoaded = false; loadAdminPortfolio(); } else portfolioDelete.disabled = false;
    }
    if (action) {
      action.disabled = true;
      const response = await fetch(`/api/admin/access-requests/${encodeURIComponent(action.dataset.id)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: action.dataset.adminAction })
      });
      if (response.ok) loadAdmin(); else action.disabled = false;
    }
  });

  if (body.classList.contains('admin-mode')) {
    document.querySelectorAll('.portal-view').forEach(panel => { panel.hidden = panel.dataset.view !== 'admin'; });
    document.querySelectorAll('.portal-sidebar [data-portal-view]').forEach(item => item.classList.toggle('active', item.dataset.portalView === 'admin'));
    loadAdmin();
    loadAdminPortfolio();
  }
})();
