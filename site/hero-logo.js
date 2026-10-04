// The corrected WebM removes only the outside background, preserving logo details.
(() => {
  const intro = document.querySelector('#welcome-intro');
  const video = document.querySelector('#hero-logo');
  const brand = document.querySelector('#welcome-brand');
  const skip = document.querySelector('#welcome-skip');
  if (!intro || !video || !brand || !skip) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || typeof intro.showModal !== 'function') return;

  const extraSeconds = 2;
  let playbackSeconds = 5 + extraSeconds;
  let closing = false;
  let fallbackStarted = false;
  let loadTimer, revealTimer, closeTimer;
  const previousFocus = document.activeElement;
  const reveal = () => intro.classList.remove('is-introducing');
  const finish = () => {
    intro.close();
    document.body.classList.remove('has-welcome');
    if (previousFocus instanceof HTMLElement) previousFocus.focus({preventScroll:true});
  };
  const dismiss = () => {
    if (closing) return;
    closing = true;
    [loadTimer, revealTimer, closeTimer].forEach(clearTimeout);
    video.pause();
    if (motion.matches) { finish(); return; }
    intro.classList.add('is-closing');
    setTimeout(finish, 550);
  };
  const fallback = () => {
    if (closing || fallbackStarted) return;
    fallbackStarted = true;
    clearTimeout(loadTimer);
    video.pause();
    brand.classList.remove('is-playing');
    reveal();
    closeTimer = setTimeout(dismiss, 4000);
  };
  skip.addEventListener('click', dismiss);
  intro.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
  motion.addEventListener('change', event => { if (event.matches) dismiss(); });
  video.addEventListener('loadedmetadata', () => {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    // Stretch every frame equally, adding exactly two seconds to playback.
    playbackSeconds = video.duration + extraSeconds;
    video.defaultPlaybackRate = video.duration / playbackSeconds;
    video.playbackRate = video.defaultPlaybackRate;
  }, {once:true});
  video.addEventListener('playing', () => {
    if (closing || fallbackStarted) { video.pause(); return; }
    clearTimeout(loadTimer);
    brand.classList.add('is-playing');
    // Also complete the welcome if playback stalls after it has started.
    revealTimer = setTimeout(reveal, (playbackSeconds / 2 + 0.5) * 1000);
    closeTimer = setTimeout(dismiss, (playbackSeconds + 2.5) * 1000);
  }, {once:true});
  video.addEventListener('timeupdate', () => { if (video.currentTime >= 2.5) reveal(); });
  video.addEventListener('ended', () => {
    clearTimeout(revealTimer);
    clearTimeout(closeTimer);
    reveal();
    closeTimer = setTimeout(dismiss, 1200);
  });
  video.addEventListener('error', fallback);

  intro.classList.add('is-introducing');
  intro.showModal();
  document.body.classList.add('has-welcome');
  if (!video.canPlayType('video/webm')) { fallback(); return; }
  video.muted = true;
  video.src = video.dataset.src;
  loadTimer = setTimeout(fallback, 6000);
  video.play().catch(fallback);
})();
