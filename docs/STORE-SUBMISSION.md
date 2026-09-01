# Store submission

Both packages are produced by `npm run package` into `release/`:

```
release/bale-privacy-<version>-chrome.zip
release/bale-privacy-<version>-firefox.zip
```

## Listing copy

**Name:** Privacy for Bale Web (45-character limit — currently 20)

**Summary / short description** (132-character limit):

> Blur chats, previews, media and avatars on Bale Web until you hover them. Everything stays on your device.

**Category:** Privacy & Security · **Language:** English, Persian

**Detailed description** — reuse the feature table from the README, then state
plainly: no data collection, no network requests, one permission.

## Chrome Web Store

- **Single purpose:** "Obfuscate sensitive parts of the Bale Web interface until
  the user chooses to reveal them." Everything in the extension serves it.
- **Permission justification**
  - `storage` — "Stores the user's blur preferences and lets open tabs react to
    a change without a tabs permission."
  - Content script on `https://web.bale.ai/*` — "The only site the extension
    modifies; the stylesheet that performs the blur is injected there."
- **Data usage disclosures:** tick _does not collect user data_; the extension
  makes no network requests, so all data-use questions are answered "no".
- **Privacy policy URL:** link to `docs/PRIVACY.md` in the public repository.
- **Assets:** 128×128 icon (`public/icons/icon-128.png`), at least one
  1280×800 screenshot, and a 440×280 small promo tile if you want one.
- **Remote code:** answer _No_. Everything is bundled; nothing is fetched.

## Firefox Add-ons (AMO)

- The add-on id is pinned in `scripts/manifest.mjs` and must not change between
  releases.
- `strict_min_version` is `121.0`, the first Firefox with `:has()`.
- **Source code submission is required** because the package is built with
  esbuild. Submit the repository (or a tarball of it, excluding
  `node_modules/`, `dist/` and `release/`) plus these instructions:

  ```
  Requirements: Node 22 (see .nvmrc), npm.
  Build:  npm ci && npm run build:firefox
  Output: dist/firefox/ — identical to the submitted package.
  ```

- Reviewers also ask about minified code: the bundles in the package are
  minified by esbuild from the TypeScript sources in `src/`, with no
  obfuscation and no bundled third-party runtime dependencies.

## Naming and trademarks

The extension is not published by Bale. To stay on the right side of both
stores' impersonation policies and of trademark law generally:

- Use "for Bale Web" as a descriptive reference, never as a claim of origin,
  and never place "Bale" first in a way that reads like an official app.
- Do not use Bale's logo, wordmark, colours or screenshots of their branding in
  the icon or promotional images. The icon in this repository is original
  artwork.
- Keep the disclaimer visible in the listing, the README and the options page:
  _"Independent open-source project. Not affiliated with, endorsed by, or
  connected to Bale."_

## Release checklist

1. `npm run verify`
2. Bump `version` in `package.json`, update `CHANGELOG.md`
3. `npm run package`
4. Load both zips unpacked once and smoke-test on `web.bale.ai`
5. Tag and push; attach the zips to the GitHub release
6. Upload to each store, answer the questionnaires as above
