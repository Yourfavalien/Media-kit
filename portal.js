(() => {
  const body = document.body;
  const apiBase = location.hostname === 'yourfavalien.site' ? 'https://yourfavalien-business-headquarters.aydenmtz54.workers.dev' : '';
  const mobileNav = document.getElementById('mobileNav');
  const menuButton = document.getElementById('menuButton');

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
      accessList.innerHTML = data.accessRequests.length ? data.accessRequests.map(item => `<article class="admin-item"><header><strong>${escapeHtml(item.first_name)} ${escapeHtml(item.last_name)}</strong><small>${escapeHtml(item.inquiry_type)}</small></header><p>${escapeHtml(item.company)} · ${escapeHtml(item.professional_role)}<br>${escapeHtml(item.email)}</p><p>${escapeHtml(item.reason)}</p><div class="admin-item-actions"><button data-admin-action="approve" data-id="${escapeHtml(item.id)}">Approve</button><button data-admin-action="decline" data-id="${escapeHtml(item.id)}">Decline</button></div></article>`).join('') : '<p>No pending requests.</p>';
      inquiryList.innerHTML = data.inquiries.length ? data.inquiries.map(item => `<article class="admin-item"><header><strong>${escapeHtml(item.project_name)}</strong><small>${escapeHtml(item.inquiry_type)}</small></header><p>${escapeHtml(item.company)} · ${escapeHtml(item.contact_name)}<br>${escapeHtml(item.email)}</p><p>${escapeHtml(item.project_brief)}</p></article>`).join('') : '<p>No new inquiries.</p>';
    } catch (error) {
      accessList.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
      inquiryList.innerHTML = '';
    }
  }

  document.addEventListener('click', async event => {
    const refresh = event.target.closest('[data-admin-refresh]');
    const action = event.target.closest('[data-admin-action]');
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
