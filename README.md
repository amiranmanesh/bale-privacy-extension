<div align="center">
  <img src="public/icons/icon-128.png" width="88" height="88" alt="" />
  <h1>Privacy for Bale Web</h1>
  <p><strong>Blur chats, previews, media and profile pictures on <a href="https://web.bale.ai/chat">web.bale.ai</a> until you actually need to read them.</strong></p>
  <p>
    <strong>English</strong> · <a href="README.fa.md">فارسی</a>
  </p>
  <p>
    <a href="https://amiranmanesh.github.io/bale-privacy-extension">Website</a> ·
    <a href="https://github.com/amiranmanesh/bale-privacy-extension/wiki">Wiki</a> ·
    <a href="#install">Install</a> ·
    <a href="docs/ARCHITECTURE.md">Architecture</a> ·
    <a href="https://amiranmanesh.github.io/bale-privacy-extension/privacy.html">Privacy</a> ·
    <a href="#فارسی">فارسی</a>
  </p>
  <p>
    <a href="https://github.com/amiranmanesh/bale-privacy-extension/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/amiranmanesh/bale-privacy-extension/actions/workflows/ci.yml/badge.svg" /></a>
    <a href="https://github.com/amiranmanesh/bale-privacy-extension/actions/workflows/pages.yml"><img alt="Pages" src="https://github.com/amiranmanesh/bale-privacy-extension/actions/workflows/pages.yml/badge.svg" /></a>
    <a href="https://addons.mozilla.org/firefox/addon/privacy-for-bale-web/"><img alt="Firefox Add-ons" src="https://img.shields.io/amo/v/privacy-for-bale-web?label=firefox%20add-ons&color=ff7139" /></a>
    <img alt="Manifest V3" src="https://img.shields.io/badge/manifest-v3-5b5bd6" />
    <img alt="Permissions: storage" src="https://img.shields.io/badge/permissions-storage%20only-16a34a" />
    <a href="LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-blue" /></a>
  </p>
</div>

<p align="center">
  <img src="site/assets/screenshot-hover.png" width="820"
       alt="Bale Web with names, previews and photos blurred; the pointer reveals a single row." />
</p>
<p align="center"><sub>Hovering one row reveals just that row. Everything shown is fabricated demo data.</sub></p>

---

Open Bale Web in a café, an open-plan office or a shared screen and everyone
behind you can read your conversations. This extension keeps the interface
usable while blurring everything that is actually private, and reveals a single
element when you hover it.

It is an independent, open-source project. It is **not** affiliated with,
endorsed by, or connected to Bale.

## Features

|                                 |                                                                                                                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Blur what matters**           | Chat-list names and previews, conversation header, message text, photos/videos/stickers, sender and chat-list profile pictures, the profile panel, and optionally what you are typing. Each category has its own switch. |
| **Reveal on hover**             | Move the pointer over one blurred element to read it, with an optional hover delay so you do not reveal things by accident.                                                                                              |
| **Hold to peek**                | Hold Alt (or Ctrl / Shift) to reveal the whole screen while the key is down.                                                                                                                                             |
| **Blur when you look away**     | Automatically re-blur when the window loses focus, or after a configurable period of inactivity. Both override the master switch.                                                                                        |
| **One keystroke**               | <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> toggles blurring everywhere, in every open tab.                                                                                                                             |
| **Survives Bale updates**       | Bale's class names are per-build hashes, so the extension anchors on stable component attributes instead — and you can add your own CSS selectors from the options page if something ever slips through.                 |
| **Nothing leaves your browser** | One permission (`storage`), no host permissions, no network requests, no analytics. See [docs/PRIVACY.md](docs/PRIVACY.md).                                                                                              |
| **English and Persian**         | Full RTL interface.                                                                                                                                                                                                      |

## Install

> **فارسی:** راهنمای کامل فارسی در [README.fa.md](README.fa.md) و در
> [صفحهٔ فارسی سایت](https://amiranmanesh.github.io/bale-privacy-extension/fa/) هست.

### Which browsers

| Browser                                         | Package                                                                                                         |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Chrome, Edge, Brave, Opera, Vivaldi, Arc (111+) | `…-chrome.zip` — one package for every Chromium browser                                                         |
| Firefox 121+, Firefox for Android               | `…-firefox.zip`                                                                                                 |
| Safari 16.4+ on macOS                           | built from the same source with `npm run build:safari`; needs Xcode and, to publish, an Apple Developer account |

Chromium browsers do not need separate builds — only separate store listings.
Details and what has actually been verified on each engine:
[docs/BROWSER-SUPPORT.md](docs/BROWSER-SUPPORT.md).

### From the stores

**Firefox — [Add to Firefox](https://addons.mozilla.org/firefox/addon/privacy-for-bale-web/)**

Published on addons.mozilla.org and reviewed by Mozilla. This is the path to use: the add-on
stays installed across restarts and updates itself.

**Chrome, Edge, Opera** — not submitted yet. Until then, use
[the release packages](#from-a-release-no-build-tools-needed) below; they are the same artefacts
that go to the store. Progress and the submission runbook live in
[the wiki](https://github.com/amiranmanesh/bale-privacy-extension/wiki/Publishing-and-Releases).

### From a release (no build tools needed)

Every tag publishes ready-made packages on the [releases page](https://github.com/amiranmanesh/bale-privacy-extension/releases) — the
same artefacts that go to the stores, built from the tagged source by CI.

**Chrome, Edge, Brave, Opera**

1. Download `bale-privacy-<version>-chrome.zip` from the [latest release](https://github.com/amiranmanesh/bale-privacy-extension/releases/latest).
2. Unzip it, and move the resulting folder somewhere permanent — your Documents folder,
   for example. Chrome reads the extension from that path on every start, so deleting the
   folder uninstalls it.
3. Open `chrome://extensions` (Edge: `edge://extensions`, Brave: `brave://extensions`).
4. Turn on **Developer mode**, top right.
5. Click **Load unpacked** and select the unzipped folder — the one containing
   `manifest.json`.
6. Optional: click the puzzle-piece icon in the toolbar and pin the extension.
7. Open <https://web.bale.ai/chat>. The blur is on by default.

**Firefox** — install it [from addons.mozilla.org](https://addons.mozilla.org/firefox/addon/privacy-for-bale-web/)
instead. Load a release package manually only to try a specific version or a build of your own:

1. Download `bale-privacy-<version>-firefox.zip` from the [latest release](https://github.com/amiranmanesh/bale-privacy-extension/releases/latest).
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select the ZIP file itself.
4. Open <https://web.bale.ai/chat>.

Firefox removes temporary add-ons when it closes, so this has to be repeated every session —
another reason to install the signed add-on from
[addons.mozilla.org](https://addons.mozilla.org/firefox/addon/privacy-for-bale-web/).

### From source

```bash
git clone https://github.com/amiranmanesh/bale-privacy-extension.git bale-privacy
cd bale-privacy
npm install
npm run build          # builds dist/chrome and dist/firefox
```

Then load `dist/chrome` or `dist/firefox` with the steps above. After a rebuild, press
the reload icon on the extension card, then reload the Bale tab.

## Usage

- Click the toolbar icon for the quick switches; _All settings_ opens the full
  options page.
- <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> toggles the blur. Rebind it at
  `chrome://extensions/shortcuts` or `about:addons` → _Manage Extension
  Shortcuts_.
- Hover a blurred element to reveal just that one.

## How it works, briefly

The extension injects a single stylesheet and one attribute on `<html>`:

```html
<html data-bale-privacy="active animate hover messageText messageMedia …"></html>
```

Every rule in the stylesheet is gated on those tokens, so toggling a category,
hovering, peeking or changing the blur radius rewrites one attribute or one CSS
custom property. There is no per-element JavaScript and no `MutationObserver`
over the message list, which is why new messages are blurred the instant they
paint and an idle tab costs nothing.

Read more in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), and see
[docs/SELECTORS.md](docs/SELECTORS.md) for how the selectors are derived and
repaired.

## Development

```bash
npm run dev            # watch build for Chrome
npm run dev:firefox    # watch build for Firefox
npm test               # unit tests
npm run verify         # format + lint + typecheck + test + build
npm run package        # zips both targets into release/
```

Full guide: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Documentation

|                                                                                                      |                                                   |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| [Website](https://amiranmanesh.github.io/bale-privacy-extension)                                     | What it does, screenshots, install                |
| [Wiki](https://github.com/amiranmanesh/bale-privacy-extension/wiki)                                  | Installation, every setting, troubleshooting, FAQ |
| [Settings reference](https://github.com/amiranmanesh/bale-privacy-extension/wiki/Settings-Reference) | What each switch covers, and what stays sharp     |
| [Troubleshooting](https://github.com/amiranmanesh/bale-privacy-extension/wiki/Troubleshooting)       | Start here when something looks wrong             |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)                                                         | How the blur engine works                         |
| [docs/SELECTORS.md](docs/SELECTORS.md)                                                               | How selectors are derived and repaired            |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)                                                           | Building, debugging, releasing                    |
| [CHROMEWEBSTORE.md](CHROMEWEBSTORE.md)                                                               | Store listing copy and permission justifications  |

## Contributing

Reports that a category stopped blurring are the most useful thing you can send —
[the issue forms](https://github.com/amiranmanesh/bale-privacy-extension/issues/new/choose) ask for the diagnostics that make the fix a
one-line change. Both diagnostic tools replace message text with a `«N chars»`
placeholder before printing, so their output is safe to paste.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SUPPORT.md](SUPPORT.md).

## License

[MIT](LICENSE).

---

<h2 id="فارسی" dir="rtl">فارسی</h2>

<div dir="rtl">

نسخهٔ کامل فارسی این راهنما — شامل قابلیت‌ها، راهنمای گام‌به‌گام نصب از روی ریلیز، و
توضیح مجوزها — در **[README.fa.md](README.fa.md)** است.

مستندات فارسی در [ویکی](https://github.com/amiranmanesh/bale-privacy-extension/wiki) و
[صفحهٔ فارسی سایت](https://amiranmanesh.github.io/bale-privacy-extension/fa/) هم موجود است.

</div>
