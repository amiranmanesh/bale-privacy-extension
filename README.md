<div align="center">
  <img src="public/icons/icon-128.png" width="88" height="88" alt="" />
  <h1>Privacy for Bale Web</h1>
  <p><strong>Blur chats, previews, media and profile pictures on <a href="https://web.bale.ai/chat">web.bale.ai</a> until you actually need to read them.</strong></p>
  <p>
    <a href="#install">Install</a> ·
    <a href="#features">Features</a> ·
    <a href="docs/ARCHITECTURE.md">Architecture</a> ·
    <a href="docs/PRIVACY.md">Privacy</a> ·
    <a href="#فارسی">فارسی</a>
  </p>
</div>

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

Store links are added here once the first release is reviewed.

### From source

```bash
git clone <this-repo> bale-privacy
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

## Contributing

Bug reports about a category that stopped blurring are especially welcome —
please include your browser version and the output of
[`tools/dom-probe.js`](tools/dom-probe.js), which redacts all message text
before printing. See [CONTRIBUTING.md](CONTRIBUTING.md).

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
