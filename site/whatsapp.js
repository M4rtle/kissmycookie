/* Keep the invitation usable without JavaScript and on phones. */
(() => {
  'use strict';
  const dialog = document.querySelector('#whatsapp-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const qr = dialog.querySelector('img[data-invite]');
  const openLink = dialog.querySelector('[data-whatsapp-open]');

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || link === openLink || event.defaultPrevented || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ||
        !matchMedia('(min-width: 768px) and (pointer: fine)').matches ||
        link.href !== qr.dataset.invite) return;
    event.preventDefault();
    openLink.href = link.href;
    dialog.showModal();
  });
  dialog.querySelector('[data-whatsapp-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
})();
