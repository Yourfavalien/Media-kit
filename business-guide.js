(() => {
  if (window.__YFA_BUSINESS_GUIDE__) return;
  window.__YFA_BUSINESS_GUIDE__ = true;

  const root = document.createElement('aside');
  root.className = 'business-guide';
  root.setAttribute('aria-label', 'Business headquarters guide');
  root.innerHTML = `
    <button class="business-guide-launcher" type="button" aria-expanded="false" aria-controls="businessGuidePanel"><span aria-hidden="true">👽</span> Ask the HQ guide</button>
    <section class="business-guide-panel" id="businessGuidePanel" hidden>
      <header><div><small>YOURFAVALIEN HQ</small><strong>How can I guide you?</strong></div><button type="button" data-guide-close aria-label="Close guide">×</button></header>
      <p>I can take you directly to the information your team needs.</p>
      <div class="business-guide-actions">
        <button type="button" data-guide-view="modeling">Modeling or casting</button>
        <button type="button" data-guide-view="partnerships">Brand partnership</button>
        <button type="button" data-guide-view="audience">Audience and analytics</button>
        <button type="button" data-guide-view="work">Selected work</button>
        <button type="button" data-guide-view="inquiries">Start an inquiry</button>
      </div>
      <a href="https://yourfavalien.com/contact.html">I need general contact instead →</a>
    </section>`;
  document.body.appendChild(root);

  const launcher = root.querySelector('.business-guide-launcher');
  const panel = root.querySelector('.business-guide-panel');
  const setOpen = open => { panel.hidden = !open; launcher.setAttribute('aria-expanded', String(open)); };
  launcher.addEventListener('click', () => setOpen(panel.hidden));
  root.querySelector('[data-guide-close]').addEventListener('click', () => setOpen(false));
  root.querySelectorAll('[data-guide-view]').forEach(button => button.addEventListener('click', () => {
    const target = button.dataset.guideView;
    const portalButton = document.querySelector(`[data-portal-view="${target}"]`);
    if (!document.getElementById('portal')?.hidden && portalButton) portalButton.click();
    else if (target === 'inquiries') document.querySelector('[data-open-dialog="inquiryDialog"]')?.click();
    else document.getElementById(target === 'partnerships' ? 'partnerships' : target === 'work' ? 'profile' : 'departments')?.scrollIntoView({ behavior: 'smooth' });
    setOpen(false);
  }));
})();
