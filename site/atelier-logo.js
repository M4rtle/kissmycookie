// Replay the existing cookie bite on a two-minute cadence while in view.
(() => {
  const brand = document.querySelector('#atelier-brand');
  const video = document.querySelector('#atelier-logo');
  if (!brand || !video || !video.canPlayType('video/webm')) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const repeatMs = 120000;
  let visible = false;
  let timer;
  let loadTimer;
  let failed = false;
  const stop = () => {
    clearInterval(timer);
    clearTimeout(loadTimer);
    timer = undefined;
    video.pause();
    brand.classList.remove('is-playing');
  };
  const fallback = () => {
    failed = true;
    stop();
  };
  const play = () => {
    if (!visible || document.hidden || motion.matches || failed) return;
    video.currentTime = 0;
    if (!video.hasAttribute('src')) video.src = video.dataset.src;
    clearTimeout(loadTimer);
    loadTimer = setTimeout(fallback, 10000);
    video.play().catch(fallback);
  };
  const update = () => {
    if (!visible || document.hidden || motion.matches || failed) {
      stop();
      return;
    }
    if (timer !== undefined) return;
    play();
    timer = setInterval(play, repeatMs);
  };
  video.addEventListener('loadedmetadata', () => {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    video.defaultPlaybackRate = video.duration / (video.duration + 2);
    video.playbackRate = video.defaultPlaybackRate;
  }, {once:true});
  video.addEventListener('playing', () => {
    clearTimeout(loadTimer);
    if (!visible || document.hidden || motion.matches || failed) { stop(); return; }
    brand.classList.add('is-playing');
  });
  video.addEventListener('ended', () => {
    clearTimeout(loadTimer);
    // Keep the final frame until the next bite.
  });
  video.addEventListener('error', fallback);
  motion.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      update();
    }, {threshold:0}).observe(brand);
  } else {
    visible = true;
    update();
  }
})();
