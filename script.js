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
  catch { showNotice('Não foi possível salvar. O armazenamento do navegador pode estar cheio.'); }
}
function makeId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function currentConversation() { return conversations.find(item => item.id === currentId); }
function escapeText(value) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function showNotice(message) {
  const notice = document.createElement('div');
  notice.className = 'message-actions';
  notice.textContent = message;
  messagesEl.appendChild(notice);
}
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
    button.setAttribute('aria-label', `Abrir conversa: ${conversation.title}`);
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
  avatar.setAttribute('aria-hidden', 'true');
  const content = document.createElement('div');
  content.className = 'message-content';
  const name = document.createElement('div');
  name.className = 'message-name';
  name.textContent = role === 'assistant' ? 'Yasmin' : 'Você';
  const body = document.createElement('div');
  body.className = 'message-text';
  body.textContent = text;
  content.append(name, body);
  row.append(avatar, content);
  messagesEl.append(row);
  return row;
}
function renderConversation() {
  messagesEl.replaceChildren();
  const conversation = currentConversation();
  const hasMessages = Boolean(conversation?.messages.length);
  welcomeEl.classList.toggle('hidden', hasMessages);
  messagesEl.classList.toggle('visible', hasMessages);
  if (conversation) conversation.messages.forEach(message => appendMessage(message.role, message.text));
  renderHistory();
  scrollToBottom();
}
function openConversation(id) {
  currentId = id;
  renderConversation();
  closeSidebar();
  input.focus();
}
function newConversation() {
  currentId = null;
  renderConversation();
  closeSidebar();
  input.focus();
}
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
function localReply(prompt) {
  const text = prompt.trim();
  const lower = text.toLocaleLowerCase('pt-BR');
  if (/^(oi|olá|ola|bom dia|boa tarde|boa noite|e aí|eai)[!.\s]*$/i.test(text)) return 'Olá! Que bom ter você por aqui. Como posso ajudar? Você pode me contar o que está tentando fazer ou escolher uma sugestão na tela inicial.\n\nObservação: estou no modo local de demonstração, então ainda não consulto um modelo de IA nem a internet.';
  if (/(quem é você|quem e voce|o que você é|o que voce e|yasmin)/i.test(lower)) return 'Sou a Yasmin, a assistente deste aplicativo. No momento, estou funcionando em modo local de demonstração: posso ajudar a estruturar ideias e perguntas, mas não tenho um modelo de IA conectado nem acesso à internet.\n\nPara respostas realmente inteligentes e conhecimento amplo, o app precisa ser conectado a um serviço de IA por um backend seguro.';
  if (/(organizar|tarefas|planejar|planejamento|rotina)/i.test(lower)) return 'Vamos organizar isso por etapas:\n\n1. Anote tudo o que precisa fazer.\n2. Marque o que é urgente e importante.\n3. Escolha até três prioridades para hoje.\n4. Divida cada prioridade em uma primeira ação pequena.\n5. Reserve pausas e revise o plano no fim do dia.\n\nSe você me disser suas tarefas e prazos, posso ajudar a montar uma lista mais clara. (Esta é uma sugestão local, não uma resposta gerada por IA.)';
  if (/(escrever|mensagem|e-mail|email|texto|redigir)/i.test(lower)) return 'Posso ajudar a estruturar sua mensagem. Uma forma simples é:\n\n• Cumprimente a pessoa.\n• Explique o motivo do contato em uma frase.\n• Inclua o pedido ou a informação principal.\n• Termine com o próximo passo e uma despedida.\n\nConte para quem é a mensagem, o objetivo e o tom desejado para eu preparar um rascunho. (Resposta de demonstração local.)';
  if (/(ideia|criativ|projeto|criar)/i.test(lower)) return 'Para desenvolver uma ideia, comece por três perguntas:\n\n• Que problema ou necessidade você quer atender?\n• Para quem essa solução seria útil?\n• Qual é a menor versão que você consegue testar?\n\nEscreva algumas possibilidades sem julgá-las e escolha uma para experimentar. Se me contar mais sobre o projeto, posso ajudar a organizar os próximos passos. (Resposta de demonstração local.)';
  if (/(explica|aprender|estudar|assunto|difícil)/i.test(lower)) return 'Claro — posso ajudar a tornar o assunto mais fácil de abordar. Diga qual é o tema e, se puder, seu nível de familiaridade com ele.\n\nNota: esta versão está em modo local e não tem conhecimento amplo conectado. Para explicações confiáveis sobre fatos específicos, precisamos integrar um modelo de IA e verificar fontes.';
  if (/(obrigad|valeu)/i.test(lower)) return 'Por nada! Se quiser, me conte o que você gostaria de fazer a seguir. Lembre-se: esta versão é uma demonstração local, não uma IA conectada.';
  return 'Recebi sua mensagem. Esta versão da Yasmin é uma interface demonstrativa com respostas locais simples — ela ainda não entende perguntas como um modelo de IA nem consulta conhecimentos do mundo ou a internet.\n\nPosso ajudar com sugestões básicas para organizar tarefas, estruturar textos e explorar ideias. Para respostas completas, será necessário conectar o app a um serviço de IA usando um backend seguro (nunca exponha uma chave secreta no navegador).';
}
function showTyping() {
  const row = document.createElement('article');
  row.className = 'message-row assistant';
  row.id = 'typingIndicator';
  const avatar = document.createElement('span'); avatar.className = 'message-avatar'; avatar.textContent = 'Y';
  const content = document.createElement('div'); content.className = 'message-content';
  const name = document.createElement('div'); name.className = 'message-name'; name.textContent = 'Yasmin';
  const dots = document.createElement('div'); dots.className = 'typing'; dots.setAttribute('aria-label', 'Yasmin está preparando uma resposta');
  dots.innerHTML = '<span></span><span></span><span></span>';
  content.append(name, dots); row.append(avatar, content); messagesEl.append(row); scrollToBottom();
}
function sendMessage(text) {
  const cleaned = text.trim();
  if (!cleaned || busy) return;
  if (!currentConversation()) {
    const conversation = { id: makeId(), title: titleFor(cleaned), messages: [] };
    conversations.push(conversation); currentId = conversation.id;
  }
  welcomeEl.classList.add('hidden'); messagesEl.classList.add('visible');
  createMessage('user', cleaned); appendMessage('user', cleaned); renderHistory();
  input.value = ''; autosize(); busy = true; sendButton.disabled = true; showTyping();
  window.setTimeout(() => {
    $('#typingIndicator')?.remove();
    const reply = localReply(cleaned);
    createMessage('assistant', reply); appendMessage('assistant', reply);
    busy = false; autosize(); renderHistory(); scrollToBottom(); input.focus();
  }, 450 + Math.random() * 450);
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
input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); }
});
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
