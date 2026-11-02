# Developer Cardfolio

A responsive, multilingual TCG-inspired portfolio using HTML, CSS, and JavaScript. A small Node build combines the HTML sections; no dependencies need to be installed.

## Preview and build

From `cardfolio/`, run:

```sh
npm run dev
```

Open http://127.0.0.1:8080. This builds the HTML and watches `src/`: save a source change, then refresh the browser. CSS, JavaScript, and JSON edits in `dist/` are served immediately. If port 8080 is already busy, stop the previous preview or run `PORT=8081 npm run dev`.

To build without starting a server:

```sh
npm run build
```

You can then serve `dist/` with `python3 -m http.server 8080 --directory dist`. Always use an HTTP server so language and quote JSON files can load.

## Change the page sections

```text
src/
  index.template.html   # shared sidebar, page shell, footer, project popup
  sections.json         # section order, sidebar labels, enabled flags
  sections/
    home.html
    about.html
    interests.html
    education.html
    experience.html
    projects.html
    training.html
    skills.html
    quotes.html
    contact.html
scripts/
  build.mjs             # assembles the page
  dev.mjs               # preview server and source watcher
dist/
  index.html            # generated: do not edit by hand
```

- **Edit a section:** change its file under `src/sections/`.
- **Reorder sections:** move entries in `src/sections.json`; the sidebar follows the same order.
- **Remove a section:** set its `enabled` field to `false`, or remove its registry entry. Its content and sidebar link disappear on the next build. The remaining scripts tolerate missing sections.
- **Add a section:** create a file under `src/sections/`, with one `<section id="your-id">...</section>`, then add an entry to the registry:

```json
{
  "id": "your-id",
  "file": "sections/your-id.html",
  "label": "yourSection.heading",
  "fallback": "Your section",
  "enabled": true
}
```

Add `yourSection.heading` and any other new translated labels to each language JSON file. The builder creates the sidebar link automatically. Use unique IDs, and leave the `SECTION_NAV` and `SECTIONS` markers in the shared template. Run `npm run build` after edits, or use the watcher with `npm run dev`. Build errors keep the previous generated page intact.

Publishing still uses the static `dist/` folder; the browser receives the complete page, not separate HTML downloads. Generated `dist/index.html` is excluded from formatting checks because source HTML is formatted before assembly.

## Edit your content

Each language has its own JSON file in `dist/locales/`. English, French, and Spanish are included. JSON does not allow comments, so this guide describes the labels; comments in `content.js`, `i18n.js`, and `app.js` explain how they are used.

| JSON section               | What it controls                                      |
| -------------------------- | ----------------------------------------------------- |
| `meta`                     | Browser title and description                         |
| `language`                 | Language selector label and error message             |
| `nav`                      | Navigation links                                      |
| `hero`                     | Introduction and main heading                         |
| `profile`                  | Your display name and skills                          |
| `player`                   | Developer trading card labels and ability             |
| `ticker`                   | Collector ribbon text                                 |
| `projects`                 | Collection headings, count, card labels, project text |
| `filters`                  | Visible filter button labels                          |
| `categories`, `rarities`   | Display names for shared category/rarity IDs          |
| `about`, `skills`          | Biography and loadout section                         |
| `quotes`                   | Quote section labels and the reading introduction     |
| `contact`                  | Contact labels, placeholder hints, and headings       |
| `footer`, `dialog`, `a11y` | Footer, project dialog, and accessible labels         |

For example, `nav.collection` means the `collection` label inside the `nav` object. Translate values, keeping the key names the same. Text is rendered as plain text, not HTML. Preserve placeholders such as `{count}` in every translation.

### Add a language

1. Copy `dist/locales/en.json` to a new file, such as `de.json`.
2. Translate its values. Keep its keys, project numbers, and `{count}` placeholder.
3. Add a registry entry inside the `languages` array in `dist/locales/languages.json`:

```json
{"code": "de", "label": "Deutsch", "file": "de.json", "direction": "ltr"}
```

4. Refresh the site. The new language appears automatically; no HTML or JS edits are needed.

Use the language's own name for its `label`. Set `direction` to `rtl` for a right-to-left language. The registry's `default` field chooses the initial language (`en` initially). The visitor's explicit choice is remembered when browser storage is available. Missing translation labels fall back to the default language. Failed language downloads leave the current language visible and show an error. Browser storage being blocked does not prevent switching.

### Add a project

Shared settings live in `dist/content.js`. Copy an entry and give it a unique `number`:

```js
{ title: 'My project', category: 'Web', rarity: 'RARE', number: '004', art: 'orbit', description: 'Fallback description.', tags: ['JavaScript', 'CSS'], url: 'https://example.com', sample: false }
```

Use category `Web`, `Tools`, or `Experiments`; these stable IDs keep filters working in every language. Artwork options are `orbit`, `terminal`, and `grid`. Clicking anywhere on a project card opens an enlarged card with the same artwork and frame. The popup shows a project link when its URL is set; sample notes appear only for sample projects. Close with Escape, the close button, or a click outside the card. The grid and count update automatically.

Then add the matching project number inside `projects.items` in each language file:

```json
"004": {
  "title": "My project",
  "description": "What I built and why it matters.",
  "tags": ["JavaScript", "CSS"]
}
```

If a project translation is absent, the default language or shared `content.js` text is used. For existing projects, edit the language JSON entries, which take precedence over shared fallback text.

### Add quotes (not translated)

Edit `dist/quotes.json`. This single JSON array is shared by every language. Add an object for each quote:

```json
[
  {"text": "Your favorite quotation here.", "author": "Correct author name"},
  {"text": "Another quotation, in any language.", "author": "Its author"}
]
```

Keep quotes in their original language. Switching the portfolio language changes the section labels and reading introduction, while preserving the current quote's exact text and author. Quote text does not belong in the locale files.

One random quote appears on load. “Another quote” chooses a different entry. A single quote disables the draw button; an empty array shows an editing message. A failed download or malformed JSON shows an error without affecting the rest of the portfolio. The supplied starter quotes are examples; replace them with lines you actually want to keep from your reading.

### Contact and identity

Set your display name in `profile.name`, biography in `about.bio`, grouped skills in `profile.skillGroups`, and browser title/description in `meta` for each language. Set `email` and your social profile URLs in `content.js`. The email is used by the “Contact me” mailto link and is not displayed as page text. Missing contact links are omitted. The CV is not included in the website. The text in `content.js` also serves as fallback content if JSON loading fails.

Identity, work history, education, training, and the registration API project are populated from the supplied French CV. English and Spanish versions summarize the same facts. Quotes in `dist/quotes.json` still use clearly labeled starter text; replace them with your favorites. The social profiles are configured in `content.js`; project URLs remain unset.

## Design and files

Colors and typography are CSS variables at the top of `dist/style.css`. Social icons use local SVGs; project artwork uses CSS. The site has no third-party runtime dependencies, remote fonts, or trackers. Motion respects reduced-motion preferences.

- `dist/locales/languages.json`: language registry and default
- `dist/locales/en.json`, `fr.json`, `es.json`: translated text and quotes
- `dist/quotes.json`: shared, untranslated quote text and authors
- `dist/content.js`: shared contact URLs, project structure, fallback content
- `dist/i18n.js`: JSON loading, fallback, and language preferences
- `dist/app.js`: project rendering, filters, details, random quotes
- `src/index.template.html` and `src/sections/*.html`: editable page structure
- `src/sections.json`: shared section/sidebar registry
- `dist/index.html`: generated page; rebuild after source changes
- `dist/style.css`: visual design and responsive layout
- `.openai/hosting.json`: hosting configuration; preserve the Site ID

Run `npm test` for build, translation, optional-section, and interaction checks. These tests use a lightweight DOM stand-in; visual browser layout still requires manual inspection.

## Code formatting

The source uses conventions from the [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html) and [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html): two-space indentation, spaces instead of tabs, semicolons, single-quoted JavaScript strings, braces around control blocks, and one declaration or statement per line. CSS declarations are alphabetized within their rules. Long text strings and URLs may exceed the 80-column target.

`.editorconfig` preserves indentation and line endings in supporting editors. `.prettierrc.json` keeps automated formatting consistent across HTML, CSS, JavaScript, JSON, and Markdown. To format future changes or check them, run:

```sh
npx --yes prettier@3.6.2 --write .
npx --yes prettier@3.6.2 --check .
```

Prettier handles layout; preserve the existing Google-style control blocks and CSS declaration order when adding code.

## Sidebar portfolio

The layout uses a fixed sidebar and ordinary section anchors: Home, About Me, Experience, Projects, Skills, Quotes, and Contact. On mobile the sidebar becomes a compact header. All content remains visible on the page, and section links work without JavaScript. The active navigation item follows scrolling when the browser supports IntersectionObserver.

Edit the sidebar text under `layout`, the introduction under `hall.intro`, and the section names under `hall` in each language JSON file. Add real experience entries to `experience.items` using `role`, `company`, `period`, and `description`. The current role and its supervised-project timeline come from the CV. `dist/navigation.js` renders the experience list and updates the active sidebar link. Individual project cards still open the enlarged card popup. The palette at the top of `style.css` controls the lavender sidebar and paper background.

## Updating your CV information

- `profile.name`, `profile.location`, `profile.languages`: identity and spoken languages.
- `profile.skillGroups`: grouped technical skills; add a group with `title` and `items`.
- `experience.items`: roles with `role`, `company`, `period`, `description`, optional `note`, and optional `highlights`.
- `education.items` and `training.items`: entries using the same fields as experience.

Update all three language files together. No start date, grade, proficiency level, certification status, or repository link was inferred from missing CV information.

## Social icons

GitHub, X, and LinkedIn icons appear below your name and in Contact. Add your full profile URLs to `github`, `x`, and `linkedin` in `dist/content.js`. Empty values show muted, inactive icons. Configured links open in a new tab. Icons are local SVGs in `dist/assets/icons/`, with accessible labels and no external icon library.
