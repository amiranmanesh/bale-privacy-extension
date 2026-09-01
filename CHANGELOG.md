# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[semantic versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[unreleased]: https://github.com/amiranmanesh/bale-privacy-extension/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/amiranmanesh/bale-privacy-extension/releases/tag/v0.1.0
