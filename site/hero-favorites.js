(() => {
  const hero = document.querySelector('.hero-visual');
  const favorites = favoriteIds.map(id => flavors.find(flavor => flavor.id === id));
  const captions = {
    'creme-brulee': 'Vanille met een vurig kantje.',
    'brownie-original': 'Chocolade met een binnenpretje.',
    'tiramisu': 'Een opkikkertje met Italiaanse manieren.'
  };
  const openButton = document.querySelector('#hero-open');
  const images = document.querySelector('#hero-images');
  const pauseButton = document.querySelector('#hero-pause');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, open = false, paused = motion.matches;
  const render = () => {
    const source = favorites[index];
    const flavor = I18n.localizeFlavor(source);
    hero.dataset.flavor = flavor.id;
    hero.querySelector('.hero-edition').textContent = t('ONZE FAVORIET · {name}', {name: flavor.name.toLocaleUpperCase(I18n.language)});
    hero.querySelector('.hero-caption h2').textContent = flavor.name;
    hero.querySelector('.hero-caption > span').textContent = t(captions[flavor.id]);
    const description = hero.querySelector('.hero-caption p');
    description.replaceChildren();
    const details = source.layers.filter(layer => layer[0] !== 'De afwerking').map(layer => t(layer[1]));
    const finish = source.layers.find(layer => layer[0] === 'De afwerking');
    description.append(details.join('. ') + '.');
    if (finish) description.append(document.createElement('br'), t(finish[1]) + '.');
    openButton.setAttribute('aria-pressed', String(open));
    images.setAttribute('aria-pressed', String(open));
    images.setAttribute('aria-label', t(open ? 'Toon de macaron {name}' : 'Kijk binnenin {name}', {name:flavor.name}));
    openButton.innerHTML = t(open ? 'Toon de macaron <span>−</span>' : 'Kijk binnenin <span>＋</span>');
    document.querySelector('#hero-images').classList.toggle('hero-filling-pair', open);
    document.querySelector('#hero-cut').hidden = !open;
    const photo = document.querySelector('#hero-photo');
    photo.src = open ? 'assets/fillings/' + (flavor.fillingImage || flavor.id + '.png') : 'assets/products/' + flavor.id + '.webp';
    photo.alt = t(open ? 'Voorstelling zonder bovenste schelp, met zichtbare vulling van {name}' : 'Voorstelling van {name}', {name:flavor.name});
    const cut = document.querySelector('#hero-cut img');
    cut.src = 'assets/sections/' + flavor.id + '.webp';
    cut.alt = t('Dwarsdoorsnede van {name}: {layers}', {name:flavor.name, layers:details.join(t(' en '))});
  };
  const move = direction => { index = (index + direction + favorites.length) % favorites.length; render(); };
  const syncPause = () => {
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.textContent = t(paused ? 'Hervat wisselen' : 'Pauzeer wisselen');
  };
  const toggle = () => { open = !open; render(); };
  openButton.addEventListener('click', toggle);
  images.addEventListener('click', toggle);
  images.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); }
  });
  document.querySelector('#hero-previous').addEventListener('click', () => move(-1));
  document.querySelector('#hero-next').addEventListener('click', () => move(1));
  pauseButton.addEventListener('click', () => { paused = !paused; syncPause(); });
  motion.addEventListener('change', () => { paused = motion.matches; syncPause(); });
  setInterval(() => {
    const bounds = hero.getBoundingClientRect();
    if (paused || open || document.hidden || bounds.bottom <= 0 || bounds.top >= innerHeight || hero.matches(':hover') || hero.contains(document.activeElement) || document.querySelector('#welcome-intro[open]')) return;
    move(1);
  }, 30000);
  favorites.forEach(flavor => { const image = new Image(); image.src = 'assets/products/' + flavor.id + '.webp'; });
  render();
  syncPause();
  document.addEventListener('languagechange', () => { render(); syncPause(); });
})();
