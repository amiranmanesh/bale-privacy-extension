# Contributing

Thanks for helping. The most valuable contributions are reports that a blur
category stopped working after a Bale update, and the selector fixes that follow.

## Reporting a broken category

1. Open the options page and turn on **Log selector diagnostics**.
2. Reload `web.bale.ai` and copy the console table — rows with `0` matches are
   the dead anchors.
3. Optionally run [`tools/dom-probe.js`](tools/dom-probe.js) in the page console
   and attach `copy(baleProbe.last)`. It redacts every piece of text before
   printing, so the report is safe to share.
4. Include your browser and extension version.

## Working on the code

```bash
npm install
npm run dev      # watch build for Chrome
npm run verify   # what CI runs: format, lint, typecheck, test, build
```

[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) covers loading the unpacked build and
adding a new blur category; [docs/SELECTORS.md](docs/SELECTORS.md) covers the
selector strategy.

## Ground rules

- **No runtime dependencies.** Everything ships to users' browsers; keep the
  bundle auditable. Dev dependencies are fine.
- **No new permissions** without a discussion first. `storage` plus one content
  script is a feature, not an accident.
- **No network requests.** The privacy policy is a promise the code has to keep.
- Keep the blur in CSS. If something seems to need per-element JavaScript,
  open an issue before building it.
- Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `build:`,
  `ci:`), one logical change per commit.
- Add or update tests for anything in `src/common/` or `src/content/engine/`.

## Adding a selector

See [docs/SELECTORS.md](docs/SELECTORS.md#adding-a-selector-as-a-contributor).
Mention which Bale build you verified against — the class names are hashes, so
"it works for me" needs a date attached.
