const STORAGE_KEY = 'yasmin-ai-conversations-v1';
const $ = (selector) => document.querySelector(selector);
const form = $('#chatForm');
const input = $('#messageInput');
const sendButton = $('#sendButton');
const messagesEl = $('#messages');
const welcomeEl = $('#welcome');
const historyList = $('#historyList');
const sidebar = $('#sidebar');
const backdrop = $('#sidebarBackdrop');
let conversations = loadConversations();
let currentId = null;
let busy = false;

function loadConversations() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(item => item && Array.isArray(item.messages)) : [];
  } catch { return []; }
}
function saveConversations() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations)); }
  catch { showNotice('Não foi possível salvar as conversas neste navegador.'); }
}
function makeId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function currentConversation() { return conversations.find(item => item.id === currentId); }
function titleFor(text) { return text.trim().replace(/\s+/g, ' ').slice(0, 38) || 'Nova conversa'; }
function renderHistory() {
  historyList.replaceChildren();
  if (!conversations.length) {
    const empty = document.createElement('div');
    empty.className = 'history-empty';
    empty.textContent = 'Suas conversas aparecerão aqui.';
    historyList.append(empty);
    return;
  }
  [...conversations].reverse().forEach(conversation => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `history-item${conversation.id === currentId ? ' active' : ''}`;
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.5-3A7.5 7.5 0 1 1 20 11.5Z"/></svg>'; 
    const title = document.createElement('span');
    title.textContent = conversation.title || 'Nova conversa';
    button.append(title);
    button.addEventListener('click', () => openConversation(conversation.id));
    historyList.append(button);
  });
}
function appendMessage(role, text) {
  const row = document.createElement('article');
  row.className = `message-row ${role}`;
  const avatar = document.createElement('span');
  avatar.className = 'message-avatar';
  avatar.textContent = role === 'assistant' ? 'Y' : 'Você';
  const content = document.createElement('div');
  content.className = 'message-content';
  const name = document.createElement('div');
  name.className = 'message-name';
  name.textContent = role === 'assistant' ? 'Yasmin' : 'Você';
  const body = document.createElement('div');
  body.className = 'message-text';
  body.textContent = text;
  content.append(name, body); row.append(avatar, content); messagesEl.append(row);
  return row;
}
function renderConversation() {
  messagesEl.replaceChildren();
  const conversation = currentConversation();
  const hasMessages = Boolean(conversation?.messages.length);
  welcomeEl.classList.toggle('hidden', hasMessages);
  messagesEl.classList.toggle('visible', hasMessages);
  if (conversation) conversation.messages.forEach(message => appendMessage(message.role, message.text));
  renderHistory(); scrollToBottom();
}
function openConversation(id) { currentId = id; renderConversation(); closeSidebar(); input.focus(); }
function newConversation() { currentId = null; renderConversation(); closeSidebar(); input.focus(); }
function scrollToBottom() { requestAnimationFrame(() => { const area = $('.conversation'); area.scrollTop = area.scrollHeight; }); }
function autosize() {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  sendButton.disabled = !input.value.trim() || busy;
}
function createMessage(role, text) {
  const conversation = currentConversation();
  if (!conversation) return;
  conversation.messages.push({ role, text, at: Date.now() });
  if (role === 'user' && conversation.messages.filter(message => message.role === 'user').length === 1) conversation.title = titleFor(text);
  saveConversations();
}
function showTyping() {
  const row = document.createElement('article');
  row.className = 'message-row assistant'; row.id = 'typingIndicator';
  const avatar = document.createElement('span'); avatar.className = 'message-avatar'; avatar.textContent = 'Y';
  const content = document.createElement('div'); content.className = 'message-content';
  const name = document.createElement('div'); name.className = 'message-name'; name.textContent = 'Yasmin';
  const dots = document.createElement('div'); dots.className = 'typing'; dots.innerHTML = '<span></span><span></span><span></span>'; 
  content.append(name, dots); row.append(avatar, content); messagesEl.append(row); scrollToBottom();
}
async function askYasmin(messages) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map(message => ({ role: message.role, content: message.text }))
    })
  });
  const data = await response.json().catch(() => ({ error: 'Resposta inválida da API.' }));
  if (!response.ok) {
    if (data.code === 'missing_api_key') throw new Error('A chave OPENAI_API_KEY ainda não foi configurada na Vercel.');
    throw new Error(data.error || 'Não foi possível obter a resposta da Yasmin.');
  }
  return data.reply;
}
async function sendMessage(text) {
  const cleaned = text.trim();
  if (!cleaned || busy) return;
  if (!currentConversation()) {
    const conversation = { id: makeId(), title: titleFor(cleaned), messages: [] };
    conversations.push(conversation); currentId = conversation.id;
  }
  welcomeEl.classList.add('hidden'); messagesEl.classList.add('visible');
  createMessage('user', cleaned); appendMessage('user', cleaned); renderHistory();
  input.value = ''; autosize(); busy = true; sendButton.disabled = true; showTyping();
  try {
    const conversation = currentConversation();
    const reply = await askYasmin(conversation.messages);
    $('#typingIndicator')?.remove();
    createMessage('assistant', reply); appendMessage('assistant', reply);
  } catch (error) {
    $('#typingIndicator')?.remove();
    appendMessage('assistant', `Não consegui responder agora. ${error.message}`);
  } finally {
    busy = false; autosize(); renderHistory(); scrollToBottom(); input.focus();
  }
}
function clearCurrentConversation() {
  if (!currentId) return;
  conversations = conversations.filter(item => item.id !== currentId);
  currentId = null; saveConversations(); renderConversation(); input.focus();
}
function openSidebar() { sidebar.classList.add('open'); backdrop.classList.add('open'); }
function closeSidebar() { sidebar.classList.remove('open'); backdrop.classList.remove('open'); }
form.addEventListener('submit', event => { event.preventDefault(); sendMessage(input.value); });
input.addEventListener('input', autosize);
input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
$('#newChat').addEventListener('click', newConversation);
$('#clearChat').addEventListener('click', clearCurrentConversation);
$('#openSidebar').addEventListener('click', openSidebar);
$('#closeSidebar').addEventListener('click', closeSidebar);
backdrop.addEventListener('click', closeSidebar);
document.querySelectorAll('.suggestion').forEach(button => button.addEventListener('click', () => sendMessage(button.dataset.prompt || '')));
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); newConversation(); }
  if (event.key === 'Escape') closeSidebar();
});
renderConversation();
