const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '../dist');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const json = file => JSON.parse(read(file));
const get = (object, key) =>
  key.split('.').reduce((value, part) => value?.[part], object);
const leaves = (object, prefix = '') =>
  Object.entries(object).flatMap(([key, value]) => {
    const name = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === 'object' && !Array.isArray(value)
      ? leaves(value, name)
      : [name];
  });
test('registered locales contain every label with matching types and placeholders', () => {
  const registry = json('locales/languages.json');
  const english = json('locales/en.json');
  for (const language of registry.languages) {
    const locale = json(`locales/${language.file}`);
    assert.deepEqual(leaves(locale).sort(), leaves(english).sort());
    for (const key of leaves(english)) {
      const actual = get(locale, key);
      const expected = get(english, key);
      assert.equal(typeof actual, typeof expected, `${language.code}: ${key}`);
      if (typeof actual === 'string') {
        assert.deepEqual(
          actual.match(/\{\w+\}/g),
          expected.match(/\{\w+\}/g),
          key,
        );
      }
    }
    for (const [, key] of read('index.html').matchAll(/data-i18n="([^"]+)"/g)) {
      assert.equal(typeof get(locale, key), 'string', key);
    }
  }
});
// Small DOM stand-in for testing behavior without adding a browser dependency.
class Element {
  constructor() {
    this.children = [];
    this.dataset = {};
    this.listeners = {};
    this.attrs = {};
    this.textContent = '';
    this.classList = {toggle() {}};
  }
  append(...children) {
    this.children.push(...children);
  }
  replaceChildren(...children) {
    this.children = children;
  }
  setAttribute(key, value) {
    this.attrs[key] = value;
  }
  removeAttribute(key) {
    delete this.attrs[key];
  }
  addEventListener(type, callback) {
    (this.listeners[type] ||= []).push(callback);
  }
  dispatchEvent(event) {
    return Promise.all(
      (this.listeners[event.type] || []).map(callback => callback(event)),
    );
  }
  getAttribute(key) {
    return this.attrs[key];
  }
  focus() {
    this.focused = true;
  }
  after() {}
  remove() {}
  showModal() {
    this.open = true;
  }
  close() {
    this.open = false;
  }
}
function setup(omitted = []) {
  const nodes = new Map();
  const select = selector => {
    if (omitted.includes(selector)) {
      return null;
    }
    if (!nodes.has(selector)) {
      nodes.set(selector, new Element());
    }
    return nodes.get(selector);
  };
  const labels = [...read('index.html').matchAll(/data-i18n="([^"]+)"/g)].map(
    ([, key]) => {
      const el = new Element();
      el.dataset.i18n = key;
      return el;
    },
  );
  const filters = ['All', 'Web', 'Tools', 'Experiments'].map(filter => {
    const el = new Element();
    el.dataset.filter = filter;
    return el;
  });
  const names = [new Element(), new Element()];
  const links = [
    'home',
    'about',
    'interests',
    'experience',
    'projects',
    'skills',
    'quotes',
    'contact',
  ].map(id => {
    const link = new Element();
    link.setAttribute('href', `#${id}`);
    return link;
  });
  const window = new Element();
  window.location = {hash: ''};
  window.scrollTo = () => {};
  const document = new Element();
  Object.assign(document, {
    baseURI: 'https://example.test/portfolio/',
    documentElement: {},
    title: '',
    createElement: () => new Element(),
    querySelector: select,
    querySelectorAll: selector =>
      ({
        '[data-i18n]': labels,
        '[data-filter]': filters,
        '[data-name]': names,
        '.section-nav a': links,
      })[selector] || [],
  });
  const storage = new Map();
  const responses = new Map();
  const fetch = async url => {
    const file = new URL(url, document.baseURI).pathname.replace(
      '/portfolio/',
      '',
    );
    if (responses.has(file)) {
      return responses.get(file)();
    }
    return {ok: true, json: async () => json(file)};
  };
  const context = vm.createContext({
    document,
    window,
    fetch,
    URL,
    Event,
    localStorage: {
      getItem: key => storage.get(key),
      setItem: (key, value) => storage.set(key, value),
    },
    console,
  });
  for (const file of ['content.js', 'i18n.js', 'app.js', 'navigation.js']) {
    vm.runInContext(read(file), context);
  }
  return {
    links,
    window,
    document,
    select,
    filters,
    labels,
    storage,
    responses,
    context,
    change: code =>
      vm.runInContext(`i18n.change(${JSON.stringify(code)})`, context),
  };
}
test('language changes translate dynamic content, preserve filters and quotes, and handle fetch errors', async () => {
  const app = setup();
  await app.document.dispatchEvent(new Event('DOMContentLoaded'));
  assert.equal(app.document.documentElement.lang, 'en');
  assert.equal(app.select('#project-grid').children.length, 2);
  const quoteText = app.select('#quote-text').textContent;
  await app.filters[1].dispatchEvent(new Event('click'));
  assert.equal(app.select('#project-grid').children.length, 2);
  await app.change('fr');
  assert.equal(app.document.documentElement.lang, 'fr');
  assert.equal(app.select('#project-count').textContent, '02 CARTES AFFICHÉES');
  assert.equal(app.select('#quote-text').textContent, quoteText);
  assert.equal(app.storage.get('cardfolio-language'), 'fr');
  const card = app.select('#project-grid').children[0];
  assert.equal(
    card.children[2].children[1].textContent,
    'API de gestion des inscriptions universitaires',
  );
  await card.children[2].children.at(-1).dispatchEvent(new Event('click'));
  assert.equal(
    app.select('#detail-title').textContent,
    'API de gestion des inscriptions universitaires',
  );
  await app.select('#draw-quote').dispatchEvent(new Event('click'));
  assert.notEqual(app.select('#quote-text').textContent, quoteText);
  await app.change('en');
  assert.equal(
    app.select('#detail-title').textContent,
    'University Registration API',
  );
  assert.equal(app.select('#project-count').textContent, '02 CARDS IN VIEW');
  await app.change('es');
  assert.equal(app.document.documentElement.lang, 'es');
  assert.equal(
    app.select('#project-count').textContent,
    '02 CARTAS A LA VISTA',
  );
  assert.equal(
    app.select('#detail-title').textContent,
    'API de inscripciones universitarias',
  );
  assert.equal(app.select('#language-select').value, 'es');
  assert.equal(app.storage.get('cardfolio-language'), 'es');
  // A freshly registered language appears without source edits; missing keys use English.
  const extended = setup();
  const registry = json('locales/languages.json');
  registry.languages.push({
    code: 'es-test',
    label: 'Español',
    file: 'es-test.json',
    direction: 'ltr',
  });
  extended.responses.set('locales/languages.json', async () => ({
    ok: true,
    json: async () => registry,
  }));
  extended.responses.set('locales/es-test.json', async () => ({
    ok: true,
    json: async () => ({
      hall: {projects: {title: 'Proyectos de prueba'}},
    }),
  }));
  await extended.document.dispatchEvent(new Event('DOMContentLoaded'));
  assert.equal(
    extended.select('#language-select').children.length,
    registry.languages.length,
  );
  await extended.change('es-test');
  assert.equal(
    extended.labels.find(el => el.dataset.i18n === 'hall.projects.title')
      .textContent,
    'Proyectos de prueba',
  );
  assert.equal(
    extended.labels.find(el => el.dataset.i18n === 'hall.about.title')
      .textContent,
    'About me',
  );
  assert.equal(extended.select('#draw-quote').disabled, false);
  extended.responses.set('locales/fr.json', async () => {
    throw new Error('Offline');
  });
  await extended.change('fr');
  assert.equal(extended.document.documentElement.lang, 'es-test');
  assert.equal(extended.select('#language-select').value, 'es-test');
  assert.match(
    extended.select('#language-status').textContent,
    /could not be loaded/,
  );
});

test('project inspection keeps artwork and external URLs inside the enlarged card', async () => {
  const app = setup();
  await app.document.dispatchEvent(new Event('DOMContentLoaded'));
  vm.runInContext(
    "portfolio.projects[0].url = 'https://example.com/project'; renderProjects();",
    app.context,
  );
  const card = app.select('#project-grid').children[0];
  const trigger = card.children[2].children.at(-1);
  assert.equal(trigger.attrs['aria-haspopup'], 'dialog');
  assert.equal(trigger.href, undefined);
  await trigger.dispatchEvent(new Event('click'));
  assert.equal(app.select('#project-dialog').open, true);
  assert.equal(
    app.select('#detail-title').textContent,
    'University Registration API',
  );
  assert.equal(
    app.select('#detail-art').children[0].className,
    'project-art terminal',
  );
  assert.equal(app.select('#detail-link').hidden, false);
  assert.equal(app.select('#detail-link').href, 'https://example.com/project');
  await app.select('.close-dialog').dispatchEvent(new Event('click'));
  assert.equal(app.select('#project-dialog').open, false);
  vm.runInContext(
    "portfolio.projects[0].url = ''; renderProjects();",
    app.context,
  );
  const sample = app.select('#project-grid').children[0];
  await sample.children[2].children.at(-1).dispatchEvent(new Event('click'));
  assert.equal(app.select('#detail-link').hidden, true);
  assert.equal(app.select('#detail-link').attrs.href, undefined);
});

test('sidebar anchors reach real sections and update the active location', async () => {
  const app = setup();
  await app.document.dispatchEvent(new Event('DOMContentLoaded'));
  const active = () =>
    app.links
      .filter(link => link.attrs['aria-current'])
      .map(link => link.attrs.href);
  assert.deepEqual(active(), ['#home']);
  for (const link of app.links) {
    const id = link.attrs.href.slice(1);
    assert.ok(
      read('index.html').includes(`id="${id}"`),
      `Missing section: ${id}`,
    );
  }
  app.window.location.hash = '#experience';
  await app.window.dispatchEvent(new Event('hashchange'));
  assert.deepEqual(active(), ['#experience']);
  await app.change('es');
  assert.equal(
    app.select('#experience-list').children[0].children[1].children[0]
      .textContent,
    'Desarrollador de software',
  );
  app.window.location.hash = '#projects';
  await app.window.dispatchEvent(new Event('hashchange'));
  assert.deepEqual(active(), ['#projects']);
  assert.ok(!read('index.html').includes('id="section-dialog"'));
});

test('CV content renders identity, experience, education, training, skills, and working contact links', async () => {
  const app = setup();
  await app.document.dispatchEvent(new Event('DOMContentLoaded'));
  assert.equal(
    vm.runInContext('portfolio.name', app.context),
    'Jose-Luis Caceres Reyna',
  );
  assert.equal(app.select('#experience-list').children.length, 1);
  assert.equal(app.select('#education-list').children.length, 1);
  assert.equal(app.select('#training-list').children.length, 4);
  assert.equal(app.select('#skill-groups').children.length, 6);
  const contacts = app.select('#contact-links').children;
  assert.equal(contacts.length, 2);
  assert.equal(contacts[0].href, 'mailto:jose-luis_cr@outlook.com');
  assert.equal(contacts[1].href, 'https://github.com/Hetsu21');
  assert.equal(contacts[0].textContent, 'Contact me');
  assert.ok(!read('index.html').includes('contact-email'));
  assert.ok(
    !fs.existsSync(path.join(root, 'assets/jose-luis-caceres-reyna-cv-fr.pdf')),
  );
  await app.change('fr');
  assert.equal(
    app.select('#education-list').children[0].children[1].children[0]
      .textContent,
    'Baccalauréat en informatique et génie logiciel',
  );
  assert.match(
    app.select('#experience-list').children[0].children[1].children[3]
      .textContent,
    /depuis août 2026/,
  );
  await app.filters[2].dispatchEvent(new Event('click'));
  assert.equal(app.select('#project-grid').children.length, 0);
  assert.equal(app.select('#project-empty').hidden, false);
});

test('quotes load from one JSON file and remain unchanged across languages', async () => {
  const app = setup();
  const shared = [
    {text: 'Une phrase que je garde.', author: 'Auteur'},
    {text: 'Una frase que quiero recordar.', author: 'Autor'},
  ];
  let requests = 0;
  app.responses.set('quotes.json', async () => {
    requests++;
    return {ok: true, json: async () => shared};
  });
  await app.document.dispatchEvent(new Event('DOMContentLoaded'));
  const text = app.select('#quote-text').textContent;
  const author = app.select('#quote-author').textContent;
  for (const language of ['fr', 'es', 'en']) {
    await app.change(language);
    assert.equal(app.select('#quote-text').textContent, text);
    assert.equal(app.select('#quote-author').textContent, author);
  }
  assert.equal(requests, 1);
  await app.select('#draw-quote').dispatchEvent(new Event('click'));
  assert.notEqual(app.select('#quote-text').textContent, text);
});

test('empty, single, malformed, and unavailable quote lists leave the portfolio usable', async () => {
  for (const data of [
    [],
    [{text: 'One quote.', author: 'An author'}],
    [{text: 'Missing author'}],
  ]) {
    const app = setup();
    app.responses.set('quotes.json', async () => ({
      ok: true,
      json: async () => data,
    }));
    await app.document.dispatchEvent(new Event('DOMContentLoaded'));
    assert.equal(app.select('#draw-quote').disabled, true);
    assert.equal(app.select('#project-grid').children.length, 2);
    if (data.length === 1 && data[0].author) {
      assert.equal(app.select('#quote-text').textContent, '“One quote.”');
    } else if (data.length) {
      assert.match(app.select('#quote-text').textContent, /couldn’t be loaded/);
    } else {
      assert.equal(
        app.select('#quote-author').textContent,
        'Add a quote in quotes.json',
      );
    }
  }
  const app = setup();
  app.responses.set('quotes.json', async () => {
    throw new Error('Offline');
  });
  await app.document.dispatchEvent(new Event('DOMContentLoaded'));
  assert.match(app.select('#quote-text').textContent, /couldn’t be loaded/);
  assert.equal(app.select('#project-grid').children.length, 2);
});

test('removing optional sections does not break translation or remaining navigation', async () => {
  const app = setup([
    '#bio',
    '#project-grid',
    '#quote-text',
    '#draw-quote',
    '#skill-groups',
    '#contact-links',
    '#contact-social-links',
    '#experience-list',
    '#education-list',
    '#training-list',
  ]);
  await app.document.dispatchEvent(new Event('DOMContentLoaded'));
  await app.change('fr');
  assert.equal(app.document.documentElement.lang, 'fr');
  assert.equal(app.select('#social-links').children.length, 3);
});
