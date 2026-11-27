const listenButton = document.querySelector('#listenButton');

listenButton?.addEventListener('click', () => {
  listenButton.classList.toggle('playing');
  const playing = listenButton.classList.contains('playing');
  listenButton.querySelector('.play-icon').textContent = playing ? 'Ⅱ' : '▶';
  listenButton.querySelector('span:last-child').textContent = playing ? 'TOCANDO...' : 'OUVIR AGORA';
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
