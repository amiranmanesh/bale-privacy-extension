# Store submission

> The listing copy, permission justifications and data-use answers live in
> [`CHROMEWEBSTORE.md`](../CHROMEWEBSTORE.md) — copy from there at submission time.
> The step-by-step runbook is in the
> [wiki](https://github.com/amiranmanesh/bale-privacy-extension/wiki/Publishing-and-Releases).
> This file covers the parts that belong with the build.

Both packages are produced by `npm run package` into `release/`:

```
release/bale-privacy-<version>-chrome.zip
release/bale-privacy-<version>-firefox.zip
```

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
- **Privacy policy URL:** <https://amiranmanesh.github.io/bale-privacy-extension/privacy.html>
  (published from `site/` by the Pages workflow).
- **Assets:** 128×128 icon (`public/icons/icon-128.png`) and the 1280×800 screenshots in
  `site/assets/`, regenerated with `node scripts/screenshots.mjs`. They are rendered from
  a fabricated conversation, so no real account or message is ever published.
- **Remote code:** answer _No_. Everything is bundled; nothing is fetched.

## Packaging

Always build the archives with `npm run package`. It zips from _inside_
`dist/<target>/`, so `manifest.json` lands at the archive root, and it drops
dotfiles; the build then fails if either invariant is broken. Compressing the
`dist/firefox` folder in Finder instead produces an archive AMO rejects with
`No manifest.json was found at the root of the extension`, plus one "hidden
file flagged" warning per `__MACOSX/._*` resource fork.

## Firefox Add-ons (AMO)

- The add-on id is pinned in `scripts/manifest.mjs` and must not change between
  releases.
- `strict_min_version` is `121.0`, the first Firefox with `:has()`.
- `browser_specific_settings.gecko.data_collection_permissions` is
  `{ "required": ["none"] }` — AMO rejects new listings without the key,
  and "none" is the sentinel for an add-on that collects nothing.
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
