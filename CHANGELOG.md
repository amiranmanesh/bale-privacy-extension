# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[semantic versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The add-on is published on
  [addons.mozilla.org](https://addons.mozilla.org/firefox/addon/privacy-for-bale-web/).
  Firefox users install it from the store now: it survives a restart and updates itself.
- Releases upload themselves to AMO. Pushing a `v*` tag signs the Firefox package and
  uploads it to the pinned add-on id, together with the source archive AMO requires for
  bundled code. The step asks AMO which version is live first and skips the upload when it
  already has that version, so re-running a release is harmless.

### Fixed

- The store-publish steps in the release workflow were gated on an environment variable
  declared on the step itself, which is not in scope when that step's `if:` is evaluated —
  they would have been skipped even with the secrets present. A presence probe now reports
  whether each credential exists, and the publish steps gate on that.

### Security

- The release workflow no longer interpolates a dispatch input into a shell script. A tag
  input is validated against a semver pattern and reaches the shell through the
  environment, so it cannot execute as code.
- Store credentials are scoped to the two steps that publish. They were briefly set at
  workflow level, which put them in the environment of `npm ci` and the build, within
  reach of a compromised dependency.
- Publishing requires a `v*` tag again, on the manual path as well as on a tag push, so a
  dispatch cannot ship an arbitrary branch to a store.

## [1.0.0] — 2026-09-01

Every engine the extension claims to support has now been exercised on a real,
logged-in session. That is what the version number marks: the feature set has not
grown, the confidence in it has.

### Added

- **Firefox for Android.** Gecko refuses to install an add-on on a phone unless the
  manifest declares support, so `gecko_android` is now set alongside the desktop entry.
- **Safari.** `npm run build:safari` wraps the existing Chromium package in a macOS app
  with Apple's converter, so there is no second source tree to maintain. The generated
  Xcode project is a build artefact, regenerated on demand.
- **A browser support matrix** ([docs/BROWSER-SUPPORT.md](docs/BROWSER-SUPPORT.md)),
  summarised in both READMEs and on both language versions of the site. It answers the
  question directly: a Chromium browser does not need its own package — Chrome, Edge,
  Brave, Opera, Vivaldi and Arc all run the same zip, and only the store listings differ.

### Changed

- The Firefox manifest declares `data_collection_permissions: { required: ["none"] }`,
  which addons.mozilla.org now expects from every new submission. The declaration is
  accurate: the extension makes no network requests.

### Verified

- **Chromium** — end-to-end through `scripts/browser.mjs`: every category blurs,
  timestamps stay readable, hover reveals one element, switches propagate to open tabs,
  settings survive a restart.
- **Firefox** — the blur confirmed on a live logged-in session, on top of a clean
  `web-ext lint` and a real temporary-add-on install.
- **Safari** — the generated project compiles against Xcode 26.6.

## [0.1.1] — 2026-09-01

### Fixed

- The Persian store description was 147 characters, past the Chrome Web Store's
  132-character limit — it would have been truncated or rejected at submission. Both
  descriptions are shorter now.
- Both also said "everything stays on your device", which is imprecise: the extension
  makes no network requests, but the browser roams settings between a user's own devices
  when sync is on. They now say "no data collection", which is exactly true.
- A test enforces the store's name and description limits, and locale parity, for every
  language.

## [0.1.0] — 2026-09-01

First release. Chrome and Firefox packages built from one source tree.

### Added

- **Nine independent blur categories**: chat-list names and previews, chat-list profile
  pictures, the conversation header, message text, sender names in groups, photos and
  videos and stickers, sender profile pictures, the composer, and profile and info
  panels. Message timestamps, unread badges and reply counts stay readable on purpose.
- **Reveal on hover**, with a configurable delay so passing the pointer across the
  screen does not flash your messages.
- **Hold to peek** — reveal the whole screen while Alt, Ctrl or Shift is held.
- **Automatic blur** when the browser window loses focus, or after a period of
  inactivity. Both override the master switch and suppress every reveal, so stepping
  away always hides the screen.
- **`Alt+Shift+B`** toggles blurring in every open tab.
- **Native tooltips are suppressed** while blurring is on and reveal-on-hover is off.
  Bale keeps the last-message preview in a `title` attribute, which the browser renders
  outside the page where no stylesheet can reach it.
- **Options page** with per-category custom CSS selectors, settings import and export,
  and selector diagnostics for when a Bale update moves something.
- **English and Persian** interfaces, with full RTL support.

### Privacy

- One permission: `storage`. No host permissions, no `tabs`, no `activeTab`.
- No network requests, no analytics, no remotely hosted code.
- Settings are user preferences only. If browser sync is enabled, the browser roams them
  between the user's own devices; nothing is ever sent to the authors or a third party.

### Internals

- The blur is pure CSS: one generated stylesheet whose rules are gated on state tokens
  in a `data-bale-privacy` attribute. No per-element JavaScript and no `MutationObserver`
  over the message list.
- Selectors anchor on `aria-label` and `data-sentry-source-file` attributes, verified
  against a live logged-in session, because Bale's CSS Module class names are per-build
  hashes.

[unreleased]: https://github.com/amiranmanesh/bale-privacy-extension/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/amiranmanesh/bale-privacy-extension/releases/tag/v1.0.0
[0.1.1]: https://github.com/amiranmanesh/bale-privacy-extension/releases/tag/v0.1.1
[0.1.0]: https://github.com/amiranmanesh/bale-privacy-extension/releases/tag/v0.1.0
