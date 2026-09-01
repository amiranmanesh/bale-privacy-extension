<div align="center">
  <img src="public/icons/icon-128.png" width="88" height="88" alt="" />
  <h1>Privacy for Bale Web</h1>
  <p><strong>Blur chats, previews, media and profile pictures on <a href="https://web.bale.ai/chat">web.bale.ai</a> until you actually need to read them.</strong></p>
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

### From the stores

Not published yet — store links appear here and on the [website](https://amiranmanesh.github.io/bale-privacy-extension) once the first
release clears review. Progress and the submission runbook live in
[the wiki](https://github.com/amiranmanesh/bale-privacy-extension/wiki/Publishing-and-Releases).

### From a release

Every tag publishes ready-made packages on the [releases page](https://github.com/amiranmanesh/bale-privacy-extension/releases) — the
same artefacts that go to the stores, built from the tagged source by CI. Download the
zip for your browser, unzip it, and load the folder unpacked with the steps below.

### From source

```bash
git clone https://github.com/amiranmanesh/bale-privacy-extension.git bale-privacy
cd bale-privacy
npm install
npm run build          # builds dist/chrome and dist/firefox
```

**Chrome / Edge / Brave** — open `chrome://extensions`, turn on _Developer
mode_, choose _Load unpacked_ and pick `dist/chrome`.

**Firefox** — open `about:debugging#/runtime/this-firefox`, choose _Load
Temporary Add-on_ and pick `dist/firefox/manifest.json`.

Then open <https://web.bale.ai/chat>. The blur is on by default.

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

**حریم خصوصی برای وب بله** — افزونه‌ای برای کروم و فایرفاکس که محتوای حساس را در
<a href="https://web.bale.ai/chat">web.bale.ai</a> محو می‌کند: نام و پیش‌نمایش گفتگوها،
سربرگ گفتگو، متن پیام‌ها، عکس و ویدیو و استیکر، عکس‌های پروفایل، و در صورت تمایل
متنی که در حال نوشتنش هستید. با بردن نشانگر روی هر عنصر، همان یکی خوانا می‌شود.

**ویژگی‌ها**

- هر دسته سوییچ مستقل خودش را دارد.
- نگه داشتن کلید Alt همهٔ صفحه را موقتاً آشکار می‌کند.
- محو خودکار وقتی پنجره از حالت فعال خارج می‌شود یا مدتی بی‌کار می‌مانید.
- میان‌بر <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> برای روشن و خاموش کردن.
- رابط کاربری کامل راست‌به‌چپ.

**حریم خصوصی**

افزونه فقط از مجوز `storage` استفاده می‌کند، هیچ درخواست شبکه‌ای نمی‌فرستد و هیچ
داده‌ای را جایی ارسال یا ذخیره نمی‌کند. همهٔ تنظیمات در مرورگر خودتان می‌ماند.

**نصب از روی کد**

```bash
npm install && npm run build
```

سپس در کروم پوشهٔ `dist/chrome` و در فایرفاکس فایل `dist/firefox/manifest.json`
را بارگذاری کنید.

این پروژه مستقل و متن‌باز است و هیچ وابستگی‌ای به شرکت بله ندارد.

</div>
