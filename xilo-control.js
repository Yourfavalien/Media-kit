(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const assistants = {
    xilo: { name: 'Xilo', location: 'Main website', training: '/api/xilo/admin/training', conversations: '/api/xilo/admin/conversations', chat: '/api/chat', greetingKey: 'publicGreeting', rulesKey: 'publicRules' },
    headquarters: { name: 'Headquarters Assistant', location: 'Business Headquarters', training: '/api/headquarters/admin/training', conversations: '/api/headquarters/admin/conversations', chat: '/api/headquarters/chat', greetingKey: 'hqGreeting', rulesKey: 'hqRules' }
  };
  const commonFields = ['displayName', 'responseLength', 'allowEmoji', 'suggestions', 'personality', 'approved_facts', 'faqs', 'official_links', 'escalation_rules', 'forbidden_claims'];
  const conversationSets = { xilo: [], headquarters: [] };
  const snapshots = { xilo: new Map(), headquarters: new Map() };
  const snapshotReady = { xilo: false, headquarters: false };
  let trainingAssistant = 'xilo';
  let inboxAssistant = 'xilo';
  let currentTraining = {};
  let selected = null;
  let alertsEnabled = 'Notification' in window && localStorage.getItem('yfa-ai-alerts') === 'enabled' && Notification.permission === 'granted';

  const setStatus = (element, text, type) => { element.textContent = text; element.className = `status ${type || ''}`; };
  async function api(path, options = {}) {
    const response = await fetch(path, { ...options, cache: 'no-store', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }
  function showView(name) {
    $$('[data-panel]').forEach(panel => { panel.hidden = panel.dataset.panel !== name; });
    $$('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === name));
    $('#viewTitle').textContent = { overview: 'Overview', training: 'Assistant training', inbox: 'Live inbox' }[name];
    if (name === 'inbox') loadChats(inboxAssistant, false);
  }
  $$('[data-view]').forEach(button => { button.onclick = () => showView(button.dataset.view); });
  $$('[data-go]').forEach(button => { button.onclick = () => showView(button.dataset.go); });

  async function session() {
    try {
      const data = await api('/api/session');
      $('#userEmail').textContent = data.email || 'Secure owner access';
    } catch (_) {
      document.body.innerHTML = '<main style="min-height:100vh;display:grid;place-items:center;background:#07080a;color:#f2f1ec;font:16px Arial"><section style="max-width:520px;padding:35px"><h1>Secure access required</h1><p style="color:#9ba1ad;line-height:1.6">AI Controls is owner-only. Sign in through Cloudflare Access with Ayden’s approved email.</p></section></main>';
    }
  }
  function setTrainingFields(training) {
    const config = assistants[trainingAssistant];
    commonFields.forEach(key => {
      const element = $(`#${key}`);
      if (element.type === 'checkbox') element.checked = Boolean(training[key]);
      else element.value = training[key] || '';
    });
    $('#greeting').value = training[config.greetingKey] || '';
    $('#rules').value = training[config.rulesKey] || '';
    $('#greetingLabel').textContent = `${config.location} greeting`;
    $('#rulesLabel').textContent = `${config.location} instructions`;
    $('#forbiddenLabel').textContent = `Things ${config.name} must not claim`;
    $('#assistantSummary').textContent = `${config.location} · ${config.name}`;
  }
  async function loadTraining() {
    setStatus($('#trainingStatus'), 'Loading…');
    try {
      const data = await api(assistants[trainingAssistant].training);
      currentTraining = data.training || {};
      setTrainingFields(currentTraining);
      setStatus($('#trainingStatus'), `${assistants[trainingAssistant].name} controls loaded.`, 'ok');
    } catch (error) { setStatus($('#trainingStatus'), error.message, 'error'); }
  }
  $$('[data-assistant]').forEach(button => {
    button.onclick = () => {
      trainingAssistant = button.dataset.assistant;
      $$('[data-assistant]').forEach(item => { item.classList.toggle('active', item.dataset.assistant === trainingAssistant); item.classList.toggle('secondary', item.dataset.assistant !== trainingAssistant); });
      loadTraining();
    };
  });
  $('#reloadTraining').onclick = loadTraining;
  $('#trainingForm').onsubmit = async event => {
    event.preventDefault();
    const config = assistants[trainingAssistant];
    const training = { ...currentTraining };
    commonFields.forEach(key => { const element = $(`#${key}`); training[key] = element.type === 'checkbox' ? element.checked : element.value.trim(); });
    training[config.greetingKey] = $('#greeting').value.trim();
    training[config.rulesKey] = $('#rules').value.trim();
    setStatus($('#trainingStatus'), 'Saving…');
    try {
      await api(config.training, { method: 'POST', body: JSON.stringify({ training }) });
      currentTraining = training;
      setStatus($('#trainingStatus'), `${config.name} controls saved.`, 'ok');
    } catch (error) { setStatus($('#trainingStatus'), error.message, 'error'); }
  };
  $$('[data-test]').forEach(button => {
    button.onclick = async () => {
      const question = $('#testMessage').value.trim();
      if (!question) return;
      const kind = button.dataset.test;
      const config = assistants[kind];
      $('#testResult').textContent = `${config.name} is thinking…`;
      try {
        const data = await api(config.chat, { method: 'POST', body: JSON.stringify({ messages: [{ role: 'user', content: question }], pageUrl: kind === 'headquarters' ? 'https://yourfavalien.site/' : 'https://yourfavalien.com/', context: kind === 'headquarters' ? { area: 'public_reception' } : undefined, testMode: true }) });
        $('#testResult').textContent = data.reply;
      } catch (error) { $('#testResult').textContent = error.message; }
    };
  });

  function playAlert() {
    if (!alertsEnabled) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, context.currentTime);
    oscillator.frequency.setValueAtTime(880, context.currentTime + 0.15);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.42);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + 0.45); oscillator.onended = () => context.close();
  }
  function notifyOwner(kind, conversation) {
    if (!alertsEnabled) return;
    const config = assistants[kind];
    playAlert();
    const title = conversation.mode === 'human' ? 'Human handoff waiting' : `New ${config.name} message`;
    const notification = new Notification(title, { body: `${config.location} · Visitor ${conversation.id.slice(0, 6).toUpperCase()}`, icon: '/yourfavalien-ufo-clean.png', tag: `${kind}-${conversation.id}` });
    notification.onclick = () => { window.focus(); showView('inbox'); selectInbox(kind); notification.close(); };
  }
  function updateStats() {
    const all = [...conversationSets.xilo, ...conversationSets.headquarters];
    $('#conversationCount').textContent = all.length;
    $('#humanCount').textContent = all.filter(item => item.mode === 'human').length;
  }
  function observeConversations(kind, items, shouldNotify) {
    const previous = snapshots[kind];
    if (snapshotReady[kind] && shouldNotify) items.forEach(item => { const old = previous.get(item.id); if (!old || old.last_message_at !== item.last_message_at || old.mode !== item.mode) notifyOwner(kind, item); });
    snapshots[kind] = new Map(items.map(item => [item.id, { last_message_at: item.last_message_at, mode: item.mode }]));
    snapshotReady[kind] = true;
  }
  function renderChats() {
    const list = $('#chatList');
    const config = assistants[inboxAssistant];
    const conversations = conversationSets[inboxAssistant];
    list.innerHTML = '';
    if (!conversations.length) { list.innerHTML = '<p style="padding:18px">No conversations yet.</p>'; return; }
    conversations.forEach(conversation => {
      const button = document.createElement('button');
      button.className = `chat-card${selected && selected.id === conversation.id ? ' active' : ''}`;
      button.innerHTML = `Visitor ${conversation.id.slice(0, 6).toUpperCase()}<small>${conversation.mode === 'human' ? 'YourFavAlien answering' : `${config.name} answering`} · ${new Date(conversation.last_message_at || conversation.created_at).toLocaleString()}</small>`;
      button.onclick = () => openChat(conversation);
      list.appendChild(button);
    });
  }
  async function loadChats(kind = inboxAssistant, shouldNotify = true) {
    try {
      const data = await api(assistants[kind].conversations);
      const items = data.conversations || [];
      conversationSets[kind] = items;
      observeConversations(kind, items, shouldNotify);
      updateStats();
      if (kind === inboxAssistant) renderChats();
    } catch (error) { if (kind === inboxAssistant) setStatus($('#chatStatus'), error.message, 'error'); }
  }
  function selectInbox(kind) {
    inboxAssistant = kind;
    selected = null;
    $('#chatTitle').textContent = 'Choose a conversation';
    $('#messages').innerHTML = '<p>Messages will appear here.</p>';
    $('#takeover').disabled = true;
    $('#reply').disabled = $('#sendReply').disabled = true;
    $$('[data-inbox]').forEach(item => { item.classList.toggle('active', item.dataset.inbox === kind); item.classList.toggle('secondary', item.dataset.inbox !== kind); });
    loadChats(kind, false);
  }
  $$('[data-inbox]').forEach(button => { button.onclick = () => selectInbox(button.dataset.inbox); });
  async function openChat(conversation) {
    selected = conversation;
    renderChats();
    const config = assistants[inboxAssistant];
    $('#chatTitle').textContent = `${config.name} · Visitor ${conversation.id.slice(0, 6).toUpperCase()}`;
    $('#takeover').disabled = false;
    $('#takeover').textContent = conversation.mode === 'human' ? `Return to ${config.name}` : 'Take over as YourFavAlien';
    $('#reply').disabled = $('#sendReply').disabled = false;
    const data = await api(`${config.conversations}/${conversation.id}`);
    const box = $('#messages'); box.innerHTML = '';
    (data.messages || []).forEach(message => {
      const item = document.createElement('div'); item.className = `message ${message.sender}`;
      const label = document.createElement('small'); label.textContent = message.sender === 'ayden' ? 'YourFavAlien' : message.sender === 'visitor' ? 'Visitor' : config.name;
      item.append(label, document.createTextNode(message.body)); box.appendChild(item);
    });
    box.scrollTop = box.scrollHeight;
  }
  $('#refreshChats').onclick = () => Promise.all([loadChats('xilo', false), loadChats('headquarters', false)]);
  $('#takeover').onclick = async () => {
    if (!selected) return;
    const config = assistants[inboxAssistant];
    const mode = selected.mode === 'human' ? 'bot' : 'human';
    await api(`${config.conversations}/${selected.id}/mode`, { method: 'POST', body: JSON.stringify({ mode }) });
    selected.mode = mode;
    setStatus($('#chatStatus'), mode === 'human' ? 'YourFavAlien joined the chat. The visitor was notified.' : `The conversation returned to ${config.name}.`, 'ok');
    await openChat(selected); await loadChats(inboxAssistant, false);
  };
  $('#replyForm').onsubmit = async event => {
    event.preventDefault(); if (!selected) return;
    const body = $('#reply').value.trim(); if (!body) return;
    const config = assistants[inboxAssistant];
    await api(`${config.conversations}/${selected.id}/reply`, { method: 'POST', body: JSON.stringify({ body }) });
    $('#reply').value = ''; selected.mode = 'human'; await openChat(selected); await loadChats(inboxAssistant, false);
  };
  $('#enableAlerts').onclick = async () => {
    if (!('Notification' in window)) return setStatus($('#alertStatus'), 'Desktop notifications are not supported in this browser.', 'error');
    const permission = await Notification.requestPermission();
    alertsEnabled = permission === 'granted';
    if (alertsEnabled) {
      localStorage.setItem('yfa-ai-alerts', 'enabled'); $('#enableAlerts').textContent = 'Alerts enabled';
      setStatus($('#alertStatus'), 'Sound and desktop alerts are enabled while AI Controls is open.', 'ok'); playAlert();
    } else { localStorage.removeItem('yfa-ai-alerts'); setStatus($('#alertStatus'), 'Notification permission was not enabled.', 'error'); }
  };
  if (alertsEnabled) { $('#enableAlerts').textContent = 'Alerts enabled'; setStatus($('#alertStatus'), 'Sound and desktop alerts are enabled while AI Controls is open.', 'ok'); }
  session(); loadTraining(); Promise.all([loadChats('xilo', false), loadChats('headquarters', false)]);
  window.setInterval(() => { loadChats('xilo', true); loadChats('headquarters', true); }, 6000);
})();
