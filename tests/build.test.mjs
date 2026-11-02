import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {assemblePage} from '../scripts/build.mjs';

const template =
  '<nav>\n  <!-- SECTION_NAV -->\n</nav>\n<main>\n  <!-- SECTIONS -->\n</main>';
const sections = [
  {
    id: 'about',
    file: 'about.html',
    label: 'about.title',
    fallback: 'About',
    enabled: true,
  },
  {
    id: 'projects',
    file: 'projects.html',
    label: 'projects.title',
    fallback: 'Projects',
    enabled: true,
  },
];
const readSection = async file =>
  `<section id="${file.split('.')[0]}"><h2>Content</h2></section>`;

test('reordering or disabling a section updates both markup and navigation', async () => {
  const reordered = await assemblePage({
    template,
    sections: [...sections].reverse(),
    readSection,
  });
  assert.ok(
    reordered.indexOf('href="#projects"') < reordered.indexOf('href="#about"'),
  );
  assert.ok(
    reordered.indexOf('<section id="projects"') <
      reordered.indexOf('<section id="about"'),
  );
  const removed = await assemblePage({
    template,
    sections: [sections[0], {...sections[1], enabled: false}],
    readSection,
  });
  assert.ok(removed.includes('id="about"'));
  assert.ok(!removed.includes('projects'));
});

test('invalid registries, missing files and malformed templates fail before output', async () => {
  await assert.rejects(
    assemblePage({template, sections: [sections[0], sections[0]], readSection}),
    /duplicate/,
  );
  await assert.rejects(
    assemblePage({template: '<main></main>', sections, readSection}),
    /exactly one/,
  );
  await assert.rejects(
    assemblePage({
      template,
      sections,
      readSection: async () => '<section id="wrong"></section>',
    }),
    /must contain/,
  );
  await assert.rejects(
    assemblePage({
      template,
      sections,
      readSection: async () => {
        throw new Error('Missing file');
      },
    }),
    /Missing file/,
  );
});

test('generated index matches the current source and has no duplicate HTML IDs', async () => {
  const registry = JSON.parse(
    await readFile(new URL('../src/sections.json', import.meta.url), 'utf8'),
  );
  const source = await readFile(
    new URL('../src/index.template.html', import.meta.url),
    'utf8',
  );
  const assembled = await assemblePage({
    template: source,
    sections: registry,
    readSection: file =>
      readFile(new URL('../src/' + file, import.meta.url), 'utf8'),
  });
  assert.equal(
    await readFile(new URL('../dist/index.html', import.meta.url), 'utf8'),
    assembled,
  );
  const ids = [...assembled.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
});
