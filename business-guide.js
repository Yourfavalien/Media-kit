(() => {
  if (window.__YFA_BUSINESS_GUIDE__) return;
  window.__YFA_BUSINESS_GUIDE__ = true;

  const endpoint = 'https://xilo.yourfavalien.site/api/chat';
  const root = document.createElement('aside');
  root.className = 'business-guide';
  root.setAttribute('aria-label', 'Xylo business headquarters guide');
  root.innerHTML = `
    <button class="business-guide-launcher" type="button" aria-expanded="false" aria-controls="businessGuidePanel">Ask Xylo</button>
    <section class="business-guide-panel" id="businessGuidePanel" hidden>
      <header><div><small>XYLO / BUSINESS HEADQUARTERS</small><strong>How can I guide you?</strong></div><button type="button" data-guide-close aria-label="Close guide">×</button></header>
      <p>Ask about partnerships, modeling, casting, representation, press, or professional access.</p>
      <div class="business-guide-actions" aria-label="Quick destinations">
        <button type="button" data-guide-view="modeling">Modeling or casting</button>
        <button type="button" data-guide-view="partnerships">Brand partnership</button>
        <button type="button" data-guide-view="audience">Audience and analytics</button>
        <button type="button" data-guide-view="work">Selected work</button>
        <button type="button" data-guide-view="inquiries">Start an inquiry</button>
      </div>
      <div class="business-guide-messages" data-guide-messages aria-live="polite"></div>
      <form class="business-guide-form">
        <label class="sr-only" for="businessGuideInput">Message Xylo</label>
        <textarea id="businessGuideInput" rows="2" maxlength="1200" placeholder="Ask Xylo about the headquarters…" required></textarea>
        <button type="submit" aria-label="Send message">Send</button>
      </form>
      <a href="https://yourfavalien.com/contact">I need general contact instead →</a>
    </section>`;
  document.body.appendChild(root);

  const launcher = root.querySelector('.business-guide-launcher');
  const panel = root.querySelector('.business-guide-panel');
  const form = root.querySelector('.business-guide-form');
  const input = form.querySelector('textarea');
  const send = form.querySelector('button');
  const messages = root.querySelector('[data-guide-messages]');
  let history = [];
  let conversation = null;
  let pollTimer = 0;

  try {
    history = JSON.parse(sessionStorage.getItem('yfa-hq-xilo-history') || '[]');
    conversation = JSON.parse(sessionStorage.getItem('yfa-hq-xilo-conversation') || 'null');
  } catch (_) {}

  const save = () => {
    sessionStorage.setItem('yfa-hq-xilo-history', JSON.stringify(history.slice(-10)));
    if (conversation) sessionStorage.setItem('yfa-hq-xilo-conversation', JSON.stringify(conversation));
  };
  const addMessage = (role, text) => {
    const bubble = document.createElement('div');
    bubble.className = `business-guide-message ${role}`;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  };
  history.forEach(item => addMessage(item.role, item.content));

  const setOpen = open => {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) window.setTimeout(() => input.focus({ preventScroll: true }), 80);
  };
  launcher.addEventListener('click', () => setOpen(panel.hidden));
  root.querySelector('[data-guide-close]').addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) setOpen(false); });

  root.querySelectorAll('[data-guide-view]').forEach(button => button.addEventListener('click', () => {
    const target = button.dataset.guideView;
    const portalButton = document.querySelector(`.portal-sidebar [data-portal-view="${target}"]`);
    const portalIsOpen = !document.getElementById('portal')?.hidden;
    if (portalIsOpen && portalButton) portalButton.click();
    else if (target === 'inquiries') document.querySelector('[data-open-dialog="inquiryDialog"]')?.click();
    else if (target === 'partnerships') document.getElementById('capabilities')?.scrollIntoView({ behavior: 'smooth' });
    else if (target === 'modeling') document.getElementById('departments')?.scrollIntoView({ behavior: 'smooth' });
    else document.querySelector('[data-open-dialog="accessDialog"]')?.click();
    setOpen(false);
  }));

  async function poll() {
    if (!conversation) return;
    try {
      const response = await fetch(`${endpoint}/conversations/${encodeURIComponent(conversation.id)}/messages?token=${encodeURIComponent(conversation.token)}`, { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      (data.messages || []).filter(item => item.sender === 'ayden' && !history.some(saved => saved.id === `ayden-${item.id}`)).forEach(item => {
        addMessage('assistant', item.body);
        history.push({ id: `ayden-${item.id}`, role: 'assistant', content: item.body });
        save();
      });
    } catch (_) {}
  }
  if (conversation) pollTimer = window.setInterval(poll, 5000);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text || send.disabled) return;
    input.value = '';
    addMessage('user', text);
    history.push({ role: 'user', content: text });
    history = history.slice(-10);
    save();
    const waiting = addMessage('assistant', 'Thinking…');
    send.disabled = true;
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })), conversationId: conversation?.id, visitorToken: conversation?.token, pageUrl: window.location.href })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Xylo could not answer right now.');
      if (data.conversationId && data.visitorToken) {
        conversation = { id: data.conversationId, token: data.visitorToken };
        save();
        if (!pollTimer) pollTimer = window.setInterval(poll, 5000);
      }
      waiting.remove();
      const reply = data.reply || 'Your message is waiting for Ayden in the Xylo inbox.';
      addMessage('assistant', reply);
      history.push({ role: 'assistant', content: reply });
      history = history.slice(-10);
      save();
    } catch (error) {
      waiting.textContent = error.message || 'Xylo is temporarily unavailable. Please use the business inquiry form.';
    } finally {
      send.disabled = false;
      input.focus({ preventScroll: true });
    }
  });
})();
