# Development

## Requirements

Node 20 or newer (`.nvmrc` pins 22) and npm. No native modules, no global
tooling: the icons, the bundles and the manifests are all produced by scripts in
this repository.

## Commands

| command                                  | what it does                                                   |
| ---------------------------------------- | -------------------------------------------------------------- |
| `npm run build`                          | builds `dist/chrome` and `dist/firefox`                        |
| `npm run build:chrome` / `build:firefox` | one target only                                                |
| `npm run dev` / `dev:firefox`            | watch build (JS only — restart after editing HTML/CSS/locales) |
| `npm test` / `npm run test:watch`        | Vitest                                                         |
| `npm run typecheck`                      | `tsc --noEmit`                                                 |
| `npm run lint` / `lint:fix`              | ESLint                                                         |
| `npm run format` / `format:check`        | Prettier                                                       |
| `npm run icons`                          | regenerate `public/icons/*.png`                                |
| `npm run package`                        | build both targets and zip them into `release/`                |
| `npm run verify`                         | everything CI runs                                             |

## Loading the unpacked build

**Chrome / Edge / Brave** — `chrome://extensions` → _Developer mode_ → _Load
unpacked_ → `dist/chrome`. After a rebuild press the reload icon on the
extension card, then reload the Bale tab.

**Firefox** — `about:debugging#/runtime/this-firefox` → _Load Temporary Add-on_
→ `dist/firefox/manifest.json`. Temporary add-ons are removed when Firefox
closes.

## Debugging

- **Content script** — DevTools on the Bale tab. Turn on _Log selector
  diagnostics_ in the options page to print a match-count table per selector.
- **Background** — Chrome: the _service worker_ link on the extension card.
  Firefox: _Inspect_ on `about:debugging`. Note that a Chrome service worker
  stops when idle; it wakes for the keyboard command.
- **Popup / options** — right-click inside them and choose _Inspect_.
- **Settings** — they live under the `settings` key in `storage.sync`. The
  options page can export and re-import them as JSON.

## Testing conventions

Tests cover the pure layer: settings validation and migration, stylesheet
generation, state-token derivation, the selector registry and the generated
manifests. Anything that needs a DOM opts into jsdom with a
`// @vitest-environment jsdom` comment at the top of the file.

The selector suite parses every shipped selector. If you add one that a browser
accepts but jsdom does not, prefer rewriting it (as was done for the leaf
selector's trailing `:has()`) over disabling the check.

## Adding a blur category

1. Add the id to `TARGET_IDS` in `src/common/types.ts`.
2. Add its default to `DEFAULT_SETTINGS.targets` in `src/common/settings.ts`,
   bump `SCHEMA_VERSION` and extend `migrateSettings` if existing profiles need
   to be rewritten.
3. Add a `TargetDefinition` in `src/content/engine/selectors.ts`.
4. Add `target_<id>` to both files under `public/_locales/`.

The popup, the options page, the stylesheet and the custom-selector editor are
all generated from the registry, so no UI changes are needed.

## Releasing

1. Update `CHANGELOG.md` and the `version` in `package.json`.
2. `npm run verify && npm run package`.
3. Tag: `git tag v0.1.0 && git push --tags`. The release workflow builds both
   targets, attaches the zips to a GitHub release, and — only if the
   corresponding secrets exist — submits them to the two stores.

See [STORE-SUBMISSION.md](STORE-SUBMISSION.md) for what each store asks for.
