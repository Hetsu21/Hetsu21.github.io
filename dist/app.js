/*
 * DISPLAY LOGIC: Edit locales/*.json for translated text, content.js for
 * shared project settings.
 * Text is inserted with textContent so portfolio copy is displayed safely.
 */
const $ = selector => document.querySelector(selector);
const make = (tag, className, text) => {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) {
    el.textContent = text;
  }
  return el;
};
const t = (key, fallback, variables) => i18n.text(key, fallback, variables);
let activeFilter = 'All';
let openedProject = null;
const localizedProject = project => ({
  ...project,
  title: i18n.value(`projects.items.${project.number}.title`, project.title),
  description: i18n.value(
    `projects.items.${project.number}.description`,
    project.description,
  ),
  tags: i18n.value(`projects.items.${project.number}.tags`, project.tags),
  imageAlt: i18n.value(
    `projects.items.${project.number}.imageAlt`,
    project.title,
  ),
});
function showProject(project) {
  openedProject = project;
  const translated = localizedProject(project);
  $('#detail-title').textContent = translated.title;
  $('#detail-rarity').textContent = t(
    `rarities.${project.rarity}`,
    project.rarity,
  );
  $('#detail-type').textContent = t(
    `categories.${project.category}`,
    project.category,
  ).toUpperCase();
  $('#detail-art').replaceChildren(createProjectArt(translated));
  const link = $('#detail-link');
  link.hidden = !project.url;
  link.textContent = t('projects.explore', 'Explore project ↗');
  if (project.url) {
    link.href = project.url;
  } else {
    link.removeAttribute('href');
  }
  $('#detail-note').hidden = !project.sample;
  $('#detail-description').textContent = translated.description;
  $('#detail-tags').replaceChildren(
    ...translated.tags.map(tag => make('span', '', tag)),
  );
}
// Both the collection and enlarged card use the same artwork renderer.
function createProjectArt(project) {
  const art = make('div', `project-art ${project.art}`);
  const showFallback = () => {
    art.setAttribute('aria-hidden', 'true');
    art.replaceChildren(
      make(
        'span',
        'art-symbol',
        project.art === 'terminal' ? '>_' : project.art === 'grid' ? '✳' : '◈',
      ),
    );
  };
  if (project.image) {
    const image = make('img', 'project-image');
    image.src = project.image;
    image.alt = project.imageAlt || project.title;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', showFallback);
    art.append(image);
  } else {
    showFallback();
  }
  return art;
}
$('#year').textContent = new Date().getFullYear();

function renderProjects(filter = 'All') {
  if (!$('#project-grid')) {
    return;
  }
  const projects = portfolio.projects.filter(
    p => filter === 'All' || p.category === filter,
  );
  $('#project-grid').replaceChildren();
  $('#project-empty').hidden = projects.length > 0;
  $('#project-count').textContent = t(
    'projects.count',
    '{count} CARDS IN VIEW',
    {count: String(projects.length).padStart(2, '0')},
  );
  projects.forEach(original => {
    const project = localizedProject(original);
    const card = make('article', 'project-card');
    const top = make('div', 'project-top');
    top.append(
      make('span', '', t(`rarities.${project.rarity}`, project.rarity)),
    );
    const art = createProjectArt(project);
    const body = make('div', 'project-body');
    body.append(
      make(
        'p',
        'project-type',
        `${t(`categories.${project.category}`, project.category).toUpperCase()}${project.sample ? ' · ' + t('projects.sample', 'SAMPLE PROJECT') : ''}`,
      ),
      make('h3', '', project.title),
      make('p', 'project-description', project.description),
    );
    const tags = make('div', 'tags');
    project.tags.forEach(t => tags.append(make('span', '', t)));
    body.append(tags);
    // The real button's overlay makes the entire card clickable and keyboard accessible.
    const link = make(
      'button',
      'project-link card-zoom-trigger',
      t('projects.view', 'View card ↗'),
    );
    link.type = 'button';
    link.setAttribute(
      'aria-label',
      `${t('projects.view', 'View card')} — ${project.title}`,
    );
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', 'project-dialog');
    link.addEventListener('click', () => {
      showProject(original);
      $('#project-dialog').showModal();
    });
    body.append(link);
    card.append(top, art, body);
    $('#project-grid').append(card);
  });
}
document.querySelectorAll('[data-filter]').forEach(button =>
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(b => {
      b.classList.toggle('active', b === button);
      b.setAttribute('aria-pressed', b === button ? 'true' : 'false');
    });
    activeFilter = button.dataset.filter;
    renderProjects(activeFilter);
  }),
);
// Quote text has one shared source, independent of the selected UI language.
let quotes = [];
let quotesStatus = 'loading';
let currentQuote = -1;
async function loadQuotes() {
  if (!$('#quote-text')) {
    return;
  }
  try {
    const response = await fetch('quotes.json');
    if (!response.ok) {
      throw new Error('Unable to load quotes.json');
    }
    const data = await response.json();
    if (
      !Array.isArray(data) ||
      !data.every(
        quote =>
          quote &&
          typeof quote.text === 'string' &&
          quote.text.trim() &&
          typeof quote.author === 'string' &&
          quote.author.trim(),
      )
    ) {
      throw new Error('Each quote needs text and author strings');
    }
    quotes = data;
    quotesStatus = 'ready';
    currentQuote = -1;
  } catch {
    quotes = [];
    quotesStatus = 'error';
  }
  drawQuote(false);
}
document.addEventListener('DOMContentLoaded', loadQuotes);
function drawQuote(chooseNew = true) {
  if (!$('#quote-text')) {
    return;
  }
  if (quotesStatus !== 'ready') {
    $('#quote-text').textContent =
      quotesStatus === 'loading'
        ? t('quotes.loading', 'Loading quotes…')
        : t(
            'quotes.loadError',
            'The quotes couldn’t be loaded. Please try refreshing.',
          );
    $('#quote-author').textContent = '';
    $('#draw-quote').disabled = true;
    return;
  }
  const count = quotes.length;
  if (!count) {
    $('#quote-text').textContent = t(
      'quotes.empty',
      'Your next favorite thought belongs here.',
    );
    $('#quote-author').textContent = t(
      'quotes.emptyAuthor',
      'Add a quote in quotes.json',
    );
    $('#draw-quote').disabled = true;
    currentQuote = -1;
    return;
  }
  // Choose a random card, excluding the currently displayed one when possible.
  const choices = quotes
    .map((_, i) => i)
    .filter(i => count === 1 || i !== currentQuote);
  if (chooseNew || currentQuote < 0 || currentQuote >= count) {
    currentQuote = choices[Math.floor(Math.random() * choices.length)];
  }
  const quote = quotes[currentQuote];
  $('#quote-text').textContent = `“${quote.text}”`;
  $('#quote-author').textContent = `— ${quote.author}`;
  $('#draw-quote').disabled = count < 2;
}
$('#draw-quote')?.addEventListener('click', () => drawQuote());
$('#project-dialog').addEventListener('close', () => {
  openedProject = null;
});
$('.close-dialog').addEventListener('click', () =>
  $('#project-dialog').close(),
);
$('#project-dialog').addEventListener('click', event => {
  if (event.target === $('#project-dialog')) {
    const r = event.target.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    ) {
      event.target.close();
    }
  }
});
// Social icons are local SVGs. Empty URLs stay visible without fake destinations.
function renderSocialLinks() {
  ['#social-links', '#contact-social-links'].forEach(selector => {
    const group = $(selector);
    if (!group) {
      return;
    }
    group.replaceChildren();
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', t('social.label', 'Social profiles'));
    [
      ['github', 'GitHub'],
      ['x', 'X'],
      ['linkedin', 'LinkedIn'],
    ].forEach(([key, label]) => {
      const url = portfolio[key]?.trim() || '';
      const active = /^https?:\/\//i.test(url);
      const icon = make(
        active ? 'a' : 'span',
        active ? 'social-link' : 'social-link is-unset',
      );
      const title = active
        ? label
        : t('social.pending', '{network} — profile link not added yet', {
            network: label,
          });
      icon.title = title;
      icon.setAttribute('aria-label', title);
      if (active) {
        icon.href = url;
        icon.target = '_blank';
        icon.rel = 'noopener noreferrer';
      } else {
        icon.setAttribute('role', 'img');
      }
      const image = make('img', 'social-icon');
      image.src = `assets/icons/${key}.svg`;
      image.alt = '';
      image.width = 19;
      image.height = 19;
      icon.append(image);
      group.append(icon);
    });
  });
}

function renderContact() {
  if (!$('#contact-links')) {
    return;
  }
  $('#contact-links').replaceChildren();
  const links = [
    [
      t('contact.hello', 'Contact me'),
      portfolio.email ? `mailto:${portfolio.email}` : '',
    ],
    [t('contact.github', 'GitHub ↗'), portfolio.github],
  ];
  links
    .filter(([, url]) => url)
    .forEach(([label, url], index) => {
      const link = make(
        'a',
        index === 0 ? 'button primary' : 'button secondary',
        label,
      );
      link.href = url;
      $('#contact-links').append(link);
    });
}

function renderLanguage() {
  document
    .querySelectorAll('[data-name]')
    .forEach(
      el => (el.textContent = i18n.value('profile.name', portfolio.name)),
    );
  if ($('#bio')) {
    $('#bio').textContent = i18n.value('about.bio', portfolio.bio);
  }
  // Each skill group is translated as data, so new groups need no layout edits.
  const groups = i18n.value('profile.skillGroups', []);
  $('#skill-groups')?.replaceChildren(
    ...groups.map(group => {
      const article = make('article', 'skill-group');
      const tags = make('div', 'skills');
      tags.append(...group.items.map(skill => make('span', '', skill)));
      article.append(make('h3', '', group.title), tags);
      return article;
    }),
  );
  renderProjects(activeFilter);
  renderContact();
  renderSocialLinks();
  drawQuote(false);
  if (openedProject) {
    showProject(openedProject);
  }
}
document.addEventListener('languagechange', renderLanguage);
renderLanguage();
