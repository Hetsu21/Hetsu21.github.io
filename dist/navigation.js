/*
 * SECTION NAVIGATION
 * The sidebar links are ordinary anchors, so sections can be bookmarked and
 * reached without JavaScript. Project cards retain their zoom dialogs.
 * Add work history to experience.items in each language JSON file.
 */
function renderResumeList(selector, items) {
  const list = document.querySelector(selector);
  if (!list) {
    return;
  }
  list.replaceChildren();
  items.forEach(item => {
    const entry = make('article', 'experience-entry');
    const details = make('div', 'experience-details');
    details.append(
      make('h3', '', item.role),
      make('p', 'experience-company', item.company),
      make('p', 'experience-description', item.description),
    );
    if (item.note) {
      details.append(make('p', 'experience-note', item.note));
    }
    if (item.highlights?.length) {
      const highlights = make('ul', 'experience-highlights');
      highlights.append(...item.highlights.map(text => make('li', '', text)));
      details.append(highlights);
    }
    entry.append(make('p', 'experience-period', item.period), details);
    list.append(entry);
  });
}

function renderExperience() {
  renderResumeList('#experience-list', i18n.value('experience.items', []));
  renderResumeList('#education-list', i18n.value('education.items', []));
  renderResumeList('#training-list', i18n.value('training.items', []));
}

function highlightSection(id) {
  document.querySelectorAll('.section-nav a').forEach(link => {
    if (link.getAttribute('href') === `#${id}`) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

window.addEventListener('hashchange', () => {
  highlightSection(window.location.hash.slice(1) || 'home');
});

// Native anchor navigation still works in browsers without IntersectionObserver.
if ('IntersectionObserver' in window) {
  const observer = new window.IntersectionObserver(
    entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      if (visible.length) {
        highlightSection(visible[0].target.id);
      }
    },
    {rootMargin: '-10% 0px -65% 0px'},
  );
  document
    .querySelectorAll('.portfolio-content section, #skills')
    .forEach(section => observer.observe(section));
}

document.addEventListener('languagechange', renderExperience);
renderExperience();
highlightSection(window.location.hash.slice(1) || 'home');
