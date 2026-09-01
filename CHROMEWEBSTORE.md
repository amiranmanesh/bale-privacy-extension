# Chrome Web Store listing — Privacy for Bale Web

> Last updated: 2026-09-01 · Package: `release/bale-privacy-<version>-chrome.zip`

Everything the Developer Dashboard asks for, written out so submission is copy-paste
rather than improvisation. Keep this file in sync with `manifest.json` and
`site/privacy.html`.

## Store listing

**Extension name**

```
Privacy for Bale Web
```

**Short description** (132 char limit — 106 used)

```
Blurs chats, previews, messages, media and profile pictures on Bale Web until you hover them.
```

**Category:** Privacy & Security
**Primary language:** English (listing also supplied in Persian)

**Single purpose**

```
Visually obscures private content on web.bale.ai until the user chooses to reveal it.
```

**Detailed description**

```
Open Bale Web in an office, a café, a lecture hall or a screen share, and anyone
looking at your display can read your conversations. Privacy for Bale Web blurs the
private parts of the page and leaves the rest usable, so you can keep working without
turning your screen away from the room.

WHAT IT BLURS

Conversation names and message previews in the chat list
Message text, quoted replies, and link or document cards
Sender names in group conversations
Photos, video thumbnails, stickers and large emoji
Profile pictures — in the chat list, beside messages, in the conversation header and in
the profile panel
Optionally, the message you are currently typing

Each of these has its own switch, so you decide how much to hide. Timestamps, unread
counters and reply counts stay readable on purpose: they carry nothing private, and
they are what keeps a blurred screen usable.

HOW YOU READ SOMETHING

Move the pointer over a blurred element and just that element becomes readable. You can
add a short delay so passing the pointer across the screen does not flash your messages.
Hold Alt, Ctrl or Shift to reveal the whole screen while the key is down. Alt+Shift+B
turns blurring on and off in every open tab.

WHEN YOU WALK AWAY

Two optional settings re-blur everything the moment the window loses focus, or after a
period without keyboard or mouse activity. Both override the main switch, so stepping
away always hides the screen.

PRIVACY

The extension asks for one permission: saving your settings. It has no access to your
tabs or browsing history, it makes no network requests, it contains no analytics and no
remotely loaded code, and it never reads or transmits your messages. The blur is applied
visually to the page; the extension does not need to know what is on screen in order to
hide it.

It is free, open source under the MIT license, and the published packages are built from
the public source by an automated workflow.

Source code and issue tracker:
https://github.com/amiranmanesh/bale-privacy-extension
Privacy policy:
https://amiranmanesh.github.io/bale-privacy-extension/privacy.html

This is an independent project. It is not affiliated with, endorsed by, or connected to
Bale.
```

**Persian listing** (for the fa locale)

```
اگر وب بله را در محل کار، کافه یا هنگام اشتراک صفحه باز کنید، هر کسی که به نمایشگر شما
نگاه کند می‌تواند گفتگوهایتان را بخواند. این افزونه بخش‌های خصوصی صفحه را محو می‌کند و
بقیهٔ رابط را قابل استفاده نگه می‌دارد.

چه چیزی محو می‌شود: نام گفتگوها و پیش‌نمایش پیام‌ها، متن پیام‌ها و پاسخ‌های نقل‌شده، نام
فرستنده در گروه‌ها، عکس و ویدیو و استیکر، و تصاویر پروفایل. هر دسته سوییچ مستقل خودش را
دارد. ساعت پیام‌ها و شمارندهٔ پیام‌های نخوانده عمداً خوانا می‌مانند.

برای خواندن، کافی است نشانگر را روی همان عنصر ببرید. با نگه داشتن کلید Alt کل صفحه
موقتاً آشکار می‌شود و با Alt+Shift+B می‌توانید محو کردن را در همهٔ تب‌ها روشن یا خاموش
کنید. همچنین می‌توانید تنظیم کنید که با خارج شدن پنجره از حالت فعال یا پس از مدتی
بی‌کاری، صفحه دوباره محو شود.

تنها مجوز این افزونه ذخیرهٔ تنظیمات است. هیچ درخواست شبکه‌ای نمی‌فرستد، هیچ داده‌ای جمع
نمی‌کند و پیام‌های شما را نمی‌خواند. متن‌باز و رایگان است.

این پروژه مستقل است و وابستگی‌ای به بله ندارد.
```

## Graphics and assets

All screenshots are rendered from a fabricated conversation with fabricated names and
messages (`site/demo.html`), using the extension's real stylesheet. No real account,
contact or message appears in any published image.

| Asset                          | Dimensions  | Status      | File                                 |
| ------------------------------ | ----------- | ----------- | ------------------------------------ |
| Store icon                     | 128×128 PNG | ✅ Ready    | `public/icons/icon-128.png`          |
| Screenshot 1 — blur in action  | 1280×800    | ✅ Ready    | `site/assets/screenshot-blurred.png` |
| Screenshot 2 — hover to reveal | 1280×800    | ✅ Ready    | `site/assets/screenshot-hover.png`   |
| Screenshot 3 — the popup       | 1280×800    | ✅ Ready    | `site/assets/screenshot-popup.png`   |
| Screenshot 4 — all settings    | 1280×800    | ✅ Ready    | `site/assets/screenshot-options.png` |
| Small promo tile               | 440×280     | ⬜ Optional | —                                    |

Regenerate them all with `node scripts/screenshots.mjs`.

### Screenshot captions

1. Chat names, previews, message text and photos blurred; timestamps still readable
2. Hovering one row reveals only that row
3. Quick switches in the toolbar popup
4. Every setting, including per-category custom selectors

## Permissions justification

| Permission              | Type                 | Justification                                                                                                                                                                                                                         |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`               | permissions          | Saves the user's blur preferences (which categories are blurred, blur strength, reveal and auto-blur options) and lets every open Bale tab react immediately when a preference changes, without the extension needing access to tabs. |
| `https://web.bale.ai/*` | content script match | The single site the extension modifies. The content script adds one stylesheet that blurs private parts of the Bale Web interface. The extension does not request host permissions and cannot read or send page content.              |

There are no `host_permissions`, no `tabs` and no `activeTab`. The popup and options page
communicate with open tabs only through storage change events.

## Privacy and data use

**Does the extension collect user data?** No.

| Data type                    | Collected | Transmitted off device | Purpose | Shared |
| ---------------------------- | --------- | ---------------------- | ------- | ------ |
| Personally identifiable info | No        | No                     | —       | No     |
| Health info                  | No        | No                     | —       | No     |
| Financial info               | No        | No                     | —       | No     |
| Authentication info          | No        | No                     | —       | No     |
| Personal communications      | No        | No                     | —       | No     |
| Location                     | No        | No                     | —       | No     |
| Web history                  | No        | No                     | —       | No     |
| User activity                | No        | No                     | —       | No     |
| Website content              | No        | No                     | —       | No     |

**Note on `storage.sync`:** the extension stores a settings object (user preferences
only — no message content, no identifiers). If the user has browser sync enabled, Chrome
roams that object between their own devices, exactly as it does for any other extension
setting. Nothing is transmitted to the developer or any third party; the extension makes
no network requests at all.

### Certifications

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's single purpose
- [x] Data is NOT used for creditworthiness or lending purposes

**Privacy policy URL**

```
https://amiranmanesh.github.io/bale-privacy-extension/privacy.html
```

## Distribution

**Visibility:** Public · **Regions:** All

## Developer info

| Field          | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| Publisher name | amiranmanesh                                                  |
| Support URL    | https://github.com/amiranmanesh/bale-privacy-extension/issues |
| Homepage URL   | https://amiranmanesh.github.io/bale-privacy-extension/        |
| Contact email  | _(fill in before submitting — shown publicly on the listing)_ |

## Version history

| Version | Date | Changes                                                                                                                                                   | Status |
| ------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 0.1.0   | —    | First release: nine blur categories, hover and hold-to-reveal, auto-blur on focus loss and idle, keyboard shortcut, custom selectors, English and Persian | Draft  |

## Review notes

### Known limitations to disclose if asked

- The extension depends on Bale Web's markup. When Bale ships a redesign a category can
  stop matching; the options page lets users add their own CSS selector in the meantime.
- Bale stores the last-message preview in a `title` attribute, which the browser renders
  as a native tooltip that CSS cannot style. The extension temporarily moves that
  attribute aside while the pointer is over a row — only while blurring is on and
  hover-reveal is off — and restores it afterwards. This is the extension's only
  modification to the page besides the stylesheet.

### Pre-submission checks

- [ ] `npm run verify` green
- [ ] Version in `package.json` above the published one
- [ ] `npm run package` — upload `release/bale-privacy-<version>-chrome.zip` (built from
      `dist/chrome`, so it contains no `.git`, `node_modules`, sources or this file)
- [ ] Privacy policy URL loads
- [ ] Screenshots regenerated if the UI changed
- [ ] Contact email filled in above
