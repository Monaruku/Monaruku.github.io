// The complete archive remains readable when JavaScript is unavailable.
(() => {
  const archive = document.querySelector('[data-photo-archive]');
  const filters = archive?.querySelector('.photography-filters');
  if (!filters) return;

  const buttons = [...filters.querySelectorAll('[data-photo-filter]')];
  const albums = [...archive.querySelectorAll('[data-photo-category]')];
  const status = archive.querySelector('[data-photo-status]');
  const empty = archive.querySelector('[data-photo-empty]');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const category = button.dataset.photoFilter;
      let count = 0;
      albums.forEach(album => {
        album.hidden = category !== 'all' && album.dataset.photoCategory !== category;
        if (!album.hidden) count += 1;
      });
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      empty.hidden = count > 0;
      status.textContent = `${count} ${count === 1 ? 'album' : 'albums'} shown. ${button.textContent.trim()}.`;
    });
  });
  filters.hidden = false;
})();
