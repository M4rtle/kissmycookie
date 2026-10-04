/* Local translations only: no remote service, cookies or tracking. */
(() => {
  'use strict';
  const supported = ['nl', 'en', 'fr'];
  const storageKey = 'kissmycookie.language';
  const copy = window.KMCTranslations.copy;
  const phrases = new Map(Object.values(copy).map(values => [values[0], values]));
  Object.entries(window.KMCTranslations.dynamic).forEach(([source, values]) => phrases.set(source, [source, ...values]));
  const untranslated = new Set();
  const baseLanguage = value => typeof value === 'string' ? value.toLowerCase().split(/[-_]/)[0] : '';
  let saved;
  try { saved = localStorage.getItem(storageKey); } catch { /* Storage may be disabled. */ }
  let language = supported.includes(saved) ? saved :
    (navigator.languages || [navigator.language]).map(baseLanguage).find(value => supported.includes(value)) || 'nl';

  function t(source, parameters = {}) {
    const values = phrases.get(source);
    if (!values) untranslated.add(source);
    let value = values ? values[supported.indexOf(language)] : source;
    Object.entries(parameters).forEach(([key, replacement]) => { value = value.split('{' + key + '}').join(String(replacement)); });
    return value;
  }

  function apply() {
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const values = copy[element.dataset.i18n];
      if (values) element.innerHTML = values[supported.indexOf(language)];
    });
    ['alt', 'aria-label', 'content'].forEach(attribute => {
      document.querySelectorAll('[data-i18n-' + attribute + ']').forEach(element => {
        const values = copy[element.getAttribute('data-i18n-' + attribute)];
        if (values) element.setAttribute(attribute, values[supported.indexOf(language)]);
      });
    });
    document.querySelectorAll('[data-language]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
    document.documentElement.style.setProperty('--product-view-label', JSON.stringify(t('Bekijk')));
    const year = document.querySelector('#year');
    if (year) year.textContent = new Date().getFullYear();
  }

  function setLanguage(next) {
    if (!supported.includes(next)) return;
    try { localStorage.setItem(storageKey, next); } catch { /* Switching still works for this page. */ }
    if (next === language) return;
    language = next;
    apply();
    document.dispatchEvent(new CustomEvent('languagechange', {detail: {language}}));
  }

  function localizeFlavor(flavor) {
    return {...flavor, name: t(flavor.name), tag: t(flavor.tag), description: t(flavor.description),
      layers: flavor.layers.map(layer => layer.map(value => t(value))),
      ownPhotoContext: flavor.ownPhotoContext ? t(flavor.ownPhotoContext) : undefined,
      ownPhotoAlt: flavor.ownPhotoAlt ? t(flavor.ownPhotoAlt) : undefined};
  }

  window.I18n = {t, setLanguage, localizeFlavor, untranslated, get language() { return language; }};
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language)));
  apply();
})();
