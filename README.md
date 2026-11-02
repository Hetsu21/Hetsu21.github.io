# Jose-Luis Caceres Reyna — Portfolio

A static portfolio in English, French, and Spanish, built with HTML, CSS, JavaScript, and a small Node.js build script. No runtime dependencies or package installation required.

## Local preview

Use Node.js 24 or newer. From the repository folder:

```sh
npm run dev
```

Open http://127.0.0.1:8080. Saving HTML source changes automatically rebuilds the page; refresh your browser to see them. If port 8080 is busy, stop the previous preview or run `PORT=8081 npm run dev`.

```sh
npm run build  # Generate dist/index.html
npm test      # Check the build, translations, navigation, and interactions
```

## Publish on GitHub Pages

1. In this repository on GitHub, go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Commit and push these files to `main`.
4. Watch **Actions → Deploy portfolio to GitHub Pages** for the deployment result.

The included workflow builds and tests the portfolio, then publishes only `dist/`. Pull requests run the checks without deploying. No custom token or third-party hosting service is required.

For the current repository, the expected URL after a successful deployment is:

https://hetsu21.github.io/

Assets, translations, and quotes use relative paths. The repository is named `Hetsu21.github.io`, so GitHub Pages serves it at the account’s root address. The repository does not need a root-level `index.html` because the workflow publishes `dist/` directly.

## Files to edit

| File                                         | Purpose                                                          |
| -------------------------------------------- | ---------------------------------------------------------------- |
| `src/index.template.html`                    | Shared page shell, sidebar, footer, project popup                |
| `src/sections/*.html`                        | One editable HTML file per section                               |
| `src/sections.json`                          | Section order, sidebar labels, enabled flags                     |
| `dist/locales/en.json`, `fr.json`, `es.json` | Translated content                                               |
| `dist/locales/languages.json`                | Available languages and default                                  |
| `dist/content.js`                            | Shared identity, contact URLs, social profiles, project settings |
| `dist/quotes.json`                           | Shared quote text and authors, never translated                  |
| `dist/style.css`                             | Colors, typography, responsive layout                            |
| `dist/assets/icons/`                         | Local social icons                                               |
| `scripts/`                                   | Build and local preview tools                                    |
| `tests/`                                     | Regression checks                                                |
| `.github/workflows/pages.yml`                | GitHub Pages build and deployment                                |

`dist/index.html` is generated. Edit `src/` and rebuild instead of editing that file directly. The other `dist/` files are editable website assets and must remain in the repository.

## Add, remove, or reorder sections

Change entries in `src/sections.json`:

- Reorder entries to change page and sidebar order.
- Set `enabled` to `false` to hide a section.
- To add one, create `src/sections/your-section.html` with `<section id="your-section">...</section>` and register it:

```json
{
  "id": "your-section",
  "file": "sections/your-section.html",
  "label": "yourSection.heading",
  "fallback": "Your section",
  "enabled": true
}
```

Add the corresponding translation keys in each language file. Keep IDs unique and preserve the `SECTION_NAV` and `SECTIONS` template markers. The builder generates the sidebar automatically; browser scripts tolerate removed sections.

## Update content

- **About Me:** `about.bio` in each locale file.
- **Current interests:** `interests` in each locale file; its HTML is `src/sections/interests.html`.
- **Experience, education, training:** their `items` arrays, with `role`, `company`, `period`, `description`, optional `note`, and optional `highlights`.
- **Technical skills:** `profile.skillGroups`, with `title` and `items`.
- **Projects:** add the shared project to `dist/content.js`, then its translated text under `projects.items.<number>` in each locale. Use a unique number and the category `Web`, `Tools`, or `Experiments`. A project URL is optional.
- **Social profiles:** `github`, `x`, and `linkedin` in `dist/content.js`. Empty values show inactive icons.
- **Contact:** `email` powers the Contact me button through `mailto:`; the address is not displayed as page text. The website does not include a CV download.

## Quotes

Edit `dist/quotes.json`:

```json
[
  {"text": "Your quotation here.", "author": "Author name"},
  {
    "text": "Another quotation in its original language.",
    "author": "Author name"
  }
]
```

One quote is selected randomly on load. The button draws a different entry. Changing the UI language preserves the current quotation. There is no quote counter. Starter entries can be replaced with your own selections.

## Formatting

The dotfiles `.editorconfig`, `.prettierrc.json`, and `.prettierignore` keep formatting consistent. Do not remove their leading dots.

```sh
npx --yes prettier@3.6.2 --write .
npx --yes prettier@3.6.2 --check .
```

Source uses two-space indentation, explicit control-block braces, semicolons, and single-quoted JavaScript strings. The generated `dist/index.html` is excluded from formatting checks. Tests cover behavior using a lightweight DOM stand-in; visual browser review is still separate.
