# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[semantic versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Blur categories for chat-list text and avatars, conversation header, message
  text, sender names in groups, media, sender avatars, the composer and profile
  panels, each with its own switch.
- Reveal on hover with a configurable delay, and hold-to-peek on Alt, Ctrl or
  Shift.
- Automatic blur when the window loses focus or after a period of inactivity;
  both override the master switch.
- `Alt+Shift+B` command to toggle blurring across every open tab.
- Options page with per-category custom CSS selectors, settings import/export
  and selector diagnostics.
- English and Persian interfaces, with RTL support.
- Chrome and Firefox MV3 packages built from one source tree.
- `scripts/browser.mjs`, a driven Chromium with the built extension loaded and a
  persistent profile, used to verify selectors against a live session.

- Native tooltips of chat rows are suppressed while blurring is on and
  reveal-on-hover is off, so the browser cannot render the hidden preview text
  outside the page.

- Project website and hosted privacy policy, published to GitHub Pages from `site/`.
- `CHROMEWEBSTORE.md` with the full store listing, permission justifications and
  data-use answers, and `scripts/screenshots.mjs`, which renders store screenshots from
  a fabricated conversation so no real data is ever published.
- Issue forms for dead selectors, leaks, bugs and feature requests, plus SUPPORT.md and
  a code of conduct.

### Fixed

- Selectors now anchor on the attributes Bale actually renders (`aria-label`,
  `data-sentry-source-file`), verified against a logged-in session. The first
  set was derived from the bundle alone and matched nothing.
- Settings controls opt out of browser form restoration; without that, reopening
  the options page could write stale form values back over saved settings.
- Packages ship only the four icon sizes the manifest references, instead of the whole
  icon set.
- The privacy claim is now precise: the extension makes no network requests, but
  settings live in `storage.sync`, which the browser roams between the user's own
  devices when sync is enabled.
