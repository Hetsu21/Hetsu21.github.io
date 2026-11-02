/*
 * LANGUAGE SYSTEM
 * Add a JSON file and register it in locales/languages.json. No code changes
 * needed.
 * Translation keys use section names (nav.collection, quotes.draw, etc.).
 * Missing labels fall back to the default language. Translations are plain
 * text,
 * never HTML, so keep layout and icons in index.html. Serve over HTTP for JSON
 * loading.
 */
const i18n = (() => {
  let current = {};
  let fallback = {};
  let config;
  let active = 'en';
  let request = 0;
  const cache = new Map();
  const lookup = (object, key) =>
    key.split('.').reduce((value, part) => value?.[part], object);
  const value = (key, otherwise) =>
    lookup(current, key) ?? lookup(fallback, key) ?? otherwise;
  const text = (key, otherwise = key, variables = {}) => {
    const result = value(key, otherwise);
    return typeof result === 'string'
      ? result.replace(/\{(\w+)\}/g, (match, name) => variables[name] ?? match)
      : otherwise;
  };
  async function readJSON(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Unable to load ${path}`);
    }
    const data = await response.json();
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error(`Invalid locale: ${path}`);
    }
    return data;
  }
  async function load(language) {
    if (!cache.has(language.code)) {
      // Resolve relative to the registry; support sites served from a subdirectory.
      const url = new URL(
        language.file,
        new URL('locales/languages.json', document.baseURI),
      );
      cache.set(language.code, await readJSON(url));
    }
    return cache.get(language.code);
  }
  function apply() {
    document.documentElement.lang = active;
    document.documentElement.dir =
      config.languages.find(l => l.code === active)?.direction || 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = text(el.dataset.i18n, el.textContent);
    });
    document.title = text('meta.title', document.title);
    document.querySelector('meta[name="description"]').content = text(
      'meta.description',
      'Developer portfolio',
    );
    for (const [selector, key] of [
      ['nav', 'a11y.navigation'],
      ['.filters', 'a11y.filters'],
      ['.card-stage', 'a11y.playerCard'],
      ['.close-dialog', 'a11y.close'],
    ]) {
      document.querySelector(selector)?.setAttribute('aria-label', text(key));
    }
    document.querySelector('#language-select').value = active;
    document.querySelector('#language-status').textContent = '';
    document.dispatchEvent(new Event('languagechange'));
  }
  async function change(code) {
    const language = config.languages.find(l => l.code === code);
    if (!language) {
      return;
    }
    const version = ++request;
    const selector = document.querySelector('#language-select');
    selector.setAttribute('aria-busy', 'true');
    try {
      const data = await load(language);
      // A slower fetch must not undo a newer choice.
      if (version !== request) {
        return;
      }
      current = data;
      active = code;
      apply();
      try {
        localStorage.setItem('cardfolio-language', code);
      } catch {
        /* Private browsing may block storage. */
      }
    } catch {
      if (version !== request) {
        return;
      }
      selector.value = active;
      document.querySelector('#language-status').textContent = text(
        'language.error',
        'Unable to load this language. Please try again.',
      );
    } finally {
      if (version === request) {
        selector.removeAttribute('aria-busy');
      }
    }
  }
  async function init() {
    const selector = document.querySelector('#language-select');
    selector.disabled = true;
    try {
      config = await readJSON('locales/languages.json');
      const defaultLanguage = config.languages.find(
        l => l.code === config.default,
      );
      if (!defaultLanguage) {
        throw new Error('Missing default language');
      }
      fallback = await load(defaultLanguage);
      selector.replaceChildren(
        ...config.languages.map(language => {
          const option = document.createElement('option');
          option.value = language.code;
          option.textContent = language.label;
          option.lang = language.code;
          return option;
        }),
      );
      current = fallback;
      active = config.default;
      apply();
      let saved;
      try {
        saved = localStorage.getItem('cardfolio-language');
      } catch {
        /* Use default when unavailable. */
      }
      if (saved && saved !== active) {
        await change(saved);
      }
      selector.addEventListener('change', () => change(selector.value));
      selector.disabled = false;
    } catch {
      document.querySelector('#language-status').textContent =
        'Languages unavailable. Serve this site over HTTP and check locales/languages.json.';
    }
  }
  // Defer until the other deferred scripts attach their render listeners.
  document.addEventListener('DOMContentLoaded', init);
  return {
    text,
    value,
    change,
    get language() {
      return active;
    },
  };
})();
