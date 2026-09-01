# Firefox Add-ons (AMO) listing — Privacy for Bale Web

> Last updated: 2026-09-01 · Package: `release/bale-privacy-<version>-firefox.zip`
>
> The Chrome equivalent is [`CHROMEWEBSTORE.md`](CHROMEWEBSTORE.md). AMO asks a
> different set of questions — notably the privacy policy is pasted as text rather
> than linked, and source code submission is mandatory because the package is
> bundled with esbuild.

## Describe Add-on

**Name**

```
Privacy for Bale Web
```

**Add-on URL slug**

```
privacy-for-bale-web
```

**Summary** (250 char limit — 106 used)

```
Blurs chats, previews, messages, media and profile pictures on Bale Web until you hover them. No data collection.
```

**Description**

```
Open Bale Web in an office, a cafe, a lecture hall or a screen share, and anyone
looking at your display can read your conversations. Privacy for Bale Web blurs the
private parts of the page and leaves the rest usable, so you can keep working without
turning your screen away from the room.

WHAT IT BLURS

Conversation names and message previews in the chat list
Message text, quoted replies, and link or document cards
Sender names in group conversations
Photos, video thumbnails, stickers and large emoji
Profile pictures - in the chat list, beside messages, in the conversation header and in
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

**This add-on is experimental:** unchecked. The feature set is complete and every
engine has been exercised on a live session; ticking the box hides it from search.

**Requires payment / non-free services / additional hardware:** unchecked.

**Categories** (3 of 3 used)

| Category               | Why                                                        |
| ---------------------- | ---------------------------------------------------------- |
| Privacy & Security     | Primary. Shoulder-surfing protection is the whole purpose. |
| Appearance             | The mechanism is a stylesheet that restyles a page.        |
| Social & Communication | The page it applies to is a messenger.                     |

**Support email:** a public address you are willing to publish on the listing. AMO shows
it to every visitor, so do not use a personal mailbox — leave it empty and rely on the
support website if you do not have a dedicated address.

**Support website**

```
https://github.com/amiranmanesh/bale-privacy-extension/issues
```

**License:** MIT License — must match the `LICENSE` file in the repository.

## Privacy policy

Tick _This add-on has a Privacy Policy_ and paste the text below. AMO wants the policy
inline, not as a link — keep it in sync with `docs/PRIVACY.md` and `site/privacy.html`.

```
Privacy for Bale Web does not collect, transmit, store or sell any personal data.

WHAT THE EXTENSION DOES

It injects a stylesheet into https://web.bale.ai/* that blurs parts of the page, and it
stores your preferences.

WHAT IT STORES

One object under the key "settings" in the browser's extension storage (storage.sync,
falling back to storage.local): which categories are blurred, the blur radius, the reveal
options, the automatic-blur options and any custom CSS selectors you added.

If your browser profile is signed in and syncing extension data, that object is
synchronised by the browser itself, exactly like any other extension setting. It is never
sent to the extension's authors or to any third party - there is no third party.

WHAT IT NEVER TOUCHES

It does not read, copy, log or transmit your messages, contacts, media or account
details. The blur is CSS; the extension does not need to know what is on the page in
order to blur it.

It makes no network requests at all. There is no server, no analytics, no crash
reporting, no remote configuration and no remotely hosted code.

It does not use cookies, and it does not read or modify any page other than web.bale.ai.

PERMISSIONS

storage - save your settings and let every open tab react to a change.
Content script on https://web.bale.ai/* - inject the stylesheet that performs the blur.

There are no host permissions, no tabs permission and no activeTab permission. The popup
and the options page communicate with open tabs purely through storage change events.

PAGE MODIFICATIONS

Besides the stylesheet, the extension temporarily moves a chat row's title attribute
aside while the pointer is over it - and only when blurring is on and reveal-on-hover is
off - because the browser would otherwise render the hidden preview text as a native
tooltip. The attribute is restored as soon as the setting changes or the extension is
removed.

DIAGNOSTICS

The optional "Log selector diagnostics" setting prints how many elements each selector
matches to your own browser console. It prints counts, never content, and nothing leaves
your machine.

SOURCE CODE

The extension is open source under the MIT license and the published packages are built
from the tagged sources by a public CI workflow:
https://github.com/amiranmanesh/bale-privacy-extension

CONTACT

Please open an issue in the repository for any privacy question.

Last updated: 2026-09-01
```

## Notes to Reviewer

```
WHAT IT DOES

The add-on injects one stylesheet into https://web.bale.ai/* that blurs private parts of
the Bale Web messenger (chat names, message previews, message text, media, avatars) until
the user hovers them. It requests a single permission, "storage", for its own settings. It
has no host permissions, no tabs or activeTab, and makes no network requests of any kind -
no analytics, no remote configuration, no remotely hosted code.

The only DOM modification besides the stylesheet: a chat row's "title" attribute is moved
to a data attribute while the pointer is over the row, and restored when the pointer
leaves. Without this the browser renders the blurred preview text as a native tooltip,
which CSS cannot blur. It happens only while blurring is on and reveal-on-hover is off.

BUILD INSTRUCTIONS (source code submitted separately)

The package is bundled and minified with esbuild, so the submission includes the full
source. To reproduce the uploaded package:

  Requirements: Node 22 (see .nvmrc) and npm, on Linux or macOS.
  Build:        npm ci && npm run build:firefox
  Output:       dist/firefox/ - byte-for-byte the contents of the uploaded zip.

The bundles are minified by esbuild from the TypeScript sources in src/. There is no
obfuscation and no bundled third-party runtime dependency: every line in the package comes
from src/ in the submitted source. Entry points are src/content/index.ts,
src/background/index.ts, src/ui/popup/popup.ts and src/ui/options/options.ts, mapping to
content.js, background.js, popup.js and options.js.

Public repository: https://github.com/amiranmanesh/bale-privacy-extension

TESTING WITHOUT A BALE ACCOUNT

web.bale.ai requires an account with an Iranian phone number, which you may not be able to
create. Everything except the on-page blur can be reviewed without one: the toolbar popup
and the options page (about:addons > Preferences) work standalone, and the content script
is a few hundred lines whose entire effect is building a CSS rule list from the stored
settings.

If you would like to see the blur itself, the repository contains site/demo.html - a
static replica of the Bale Web markup with fabricated names and messages, used to generate
the listing screenshots. Serve it over HTTP and add its origin to the content_scripts
"matches" array to exercise the real code path.

NAMING

"Bale" appears descriptively, as the name of the website the add-on works on. The add-on is
independent, uses original icon artwork, no Bale branding, and states in the listing, the
options page and the README that it is not affiliated with or endorsed by Bale.
```

## Version checklist

- [ ] `npm run verify` green
- [ ] `npm run package` — upload `release/bale-privacy-<version>-firefox.zip`
- [ ] `addons-linter release/bale-privacy-<version>-firefox.zip` reports 0 errors
- [ ] Source tarball attached (repository without `node_modules/`, `dist/`, `release/`)
- [ ] Privacy policy text matches `docs/PRIVACY.md`
- [ ] Screenshots regenerated if the UI changed (`node scripts/screenshots.mjs`)
