(() => {
  const body = document.body;
  const apiBase = location.hostname === 'yourfavalien.site' ? 'https://yourfavalien-business-headquarters.aydenmtz54.workers.dev' : '';
  let editableContent = {};
  const mobileNav = document.getElementById('mobileNav');
  const menuButton = document.getElementById('menuButton');

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
  if (accessForm) accessForm.addEventListener('submit', event => {
    event.preventDefault();
    submitForm(accessForm, `${apiBase}/api/access-requests`);
  });
  if (inquiryForm) inquiryForm.addEventListener('submit', event => {
    event.preventDefault();
    submitForm(inquiryForm, `${apiBase}/api/inquiries`);
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
    });
  });

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  async function loadAdmin() {
    if (!body.classList.contains('admin-mode')) return;
    const accessList = document.getElementById('adminAccessRequests');
    const inquiryList = document.getElementById('adminInquiries');
    try {
      const response = await fetch('/api/admin/dashboard', { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load the control room.');
      const totals = document.querySelectorAll('#adminSummary strong');
      [data.accessRequests.length, data.inquiries.length, data.activePartners].forEach((value, index) => { if (totals[index]) totals[index].textContent = value; });
      editableContent = { ...editableContent, ...(data.content || {}) };
      const editor = document.getElementById('contentEditor');
      if (editor) {
        ['hero_title','hero_copy','profile_title','profile_copy','business_email'].forEach(key => { if (editor.elements[key]) editor.elements[key].value = editableContent[key] || document.querySelector(`[data-content-text="${key}"],[data-content-email="${key}"]`)?.textContent?.trim() || ''; });
        if (editableContent.hero_image) document.getElementById('heroImagePreview').src = editableContent.hero_image;
        if (editableContent.login_image) document.getElementById('loginImagePreview').src = editableContent.login_image;
      }
      accessList.innerHTML = data.accessRequests.length ? data.accessRequests.map(item => `<article class="admin-item"><header><strong>${escapeHtml(item.first_name)} ${escapeHtml(item.last_name)}</strong><small>${escapeHtml(item.inquiry_type)}</small></header><p>${escapeHtml(item.company)} · ${escapeHtml(item.professional_role)}<br>${escapeHtml(item.email)}</p><p>${escapeHtml(item.reason)}</p><div class="admin-item-actions"><button data-admin-action="approve" data-id="${escapeHtml(item.id)}">Approve</button><button data-admin-action="decline" data-id="${escapeHtml(item.id)}">Decline</button></div></article>`).join('') : '<p>No pending requests.</p>';
      inquiryList.innerHTML = data.inquiries.length ? data.inquiries.map(item => `<article class="admin-item"><header><strong>${escapeHtml(item.project_name)}</strong><small>${escapeHtml(item.inquiry_type)}</small></header><p>${escapeHtml(item.company)} · ${escapeHtml(item.contact_name)}<br>${escapeHtml(item.email)}</p><p>${escapeHtml(item.project_brief)}</p></article>`).join('') : '<p>No new inquiries.</p>';
    } catch (error) {
      accessList.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
      inquiryList.innerHTML = '';
    }
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
        ['hero_title','hero_copy','profile_title','profile_copy','business_email'].forEach(key => { content[key] = contentEditor.elements[key].value.trim(); });
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

  document.addEventListener('click', async event => {
    const refresh = event.target.closest('[data-admin-refresh]');
    const action = event.target.closest('[data-admin-action]');
    const panelButton = event.target.closest('[data-admin-panel]');
    if (panelButton) {
      const panel = panelButton.dataset.adminPanel;
      document.querySelectorAll('[data-admin-workspace]').forEach(workspace => { workspace.hidden = workspace.dataset.adminWorkspace !== panel; });
      document.querySelectorAll('[data-admin-panel]').forEach(button => button.classList.toggle('active', button.dataset.adminPanel === panel));
    }
    if (refresh) loadAdmin();
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
  }
})();
