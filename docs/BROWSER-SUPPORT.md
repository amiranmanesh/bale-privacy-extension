# Browser support

## The short version

Two packages cover every browser except Safari, and Safari needs a different
kind of artefact — not a different codebase.

| Browser                            | Engine   | Package                           | Verified                                                 |
| ---------------------------------- | -------- | --------------------------------- | -------------------------------------------------------- |
| Chrome 111+                        | Chromium | `…-chrome.zip`                    | blur, popup, options, hover, live toggling               |
| Edge 111+                          | Chromium | `…-chrome.zip`                    | same package, same APIs                                  |
| Brave, Opera, Vivaldi, Arc, Yandex | Chromium | `…-chrome.zip`                    | same package, same APIs                                  |
| Firefox 121+                       | Gecko    | `…-firefox.zip`                   | blur confirmed on a live session; lint reports no errors |
| Firefox for Android 121+           | Gecko    | `…-firefox.zip`                   | declared supported; not tested on a device               |
| Safari 16.4+ (macOS)               | WebKit   | Xcode app, `npm run build:safari` | project builds                                           |
| Safari (iOS/iPadOS)                | WebKit   | —                                 | not built; the converter can target it                   |

**A Chromium browser does not need its own package.** Chrome, Edge, Brave,
Opera, Vivaldi, Arc and the rest run the same Manifest V3 zip unmodified. What
differs is the _store listing_, not the artefact.

## Why only two builds

The extension uses four APIs — `storage`, `runtime`, `commands`, `i18n` — and a
content script. Every engine implements all of them under Manifest V3. The only
divergence worth a build flag is the background context:

|                 | Chromium                      | Gecko                       |
| --------------- | ----------------------------- | --------------------------- |
| background      | `service_worker`              | `scripts` (event page)      |
| add-on id       | assigned by the store         | pinned in the manifest      |
| minimum version | `minimum_chrome_version: 111` | `strict_min_version: 121.0` |

`scripts/manifest.mjs` emits both from one definition. Everything else — the
bundles, the stylesheet engine, the UI, the locales — is byte-identical between
the two packages.

Both baselines come from `:has()`, which one selector needs to match the sender
prefix in a group chat preview: Chromium 105 and Firefox 121, rounded up to
Chromium 111 for the derivatives that lag slightly behind upstream.

## Firefox for Android

Gecko refuses to install an add-on on Android unless it says so, so the manifest
declares it:

```json
"browser_specific_settings": {
  "gecko": { "id": "…", "strict_min_version": "121.0" },
  "gecko_android": { "strict_min_version": "121.0" }
}
```

Nothing in the extension is desktop-specific — it is a stylesheet and a popup —
but it has not been exercised on a phone, and Bale's own web app is not really
built for one. Treat it as available rather than supported.

## Safari

Safari is the one browser that cannot install a zip. A Safari web extension has
to be embedded in a macOS or iOS **app** and distributed through the App Store.

Apple's converter wraps our existing Chromium package in exactly such an app, so
there is no second source tree:

```bash
npm run build:chrome
node scripts/safari.mjs --build     # generate safari/ and compile it
node scripts/safari.mjs --open      # open the project in Xcode
```

The generated Xcode project is a build artefact: `safari/` is gitignored and
regenerated on demand, so the extension source stays the single source of truth.

What the conversion costs:

- **An Apple Developer Program membership** (USD 99/year) to sign and publish.
  Without one you can still build and run it locally, but only with Safari's
  _Develop → Allow Unsigned Extensions_ turned on, which resets on restart.
- **App Store review**, which is slower and stricter than the extension stores.
- **A host permission prompt.** Safari asks the user to grant access to
  `web.bale.ai` on first use, where Chromium and Gecko grant a declared content
  script at install.
- **macOS with Xcode** to build, so it cannot run in the Linux CI job that
  builds the other two packages.

One converter warning is expected and harmless: `options_ui.open_in_tab` is
unsupported, and Safari opens the options page its own way.

### iOS

`scripts/safari.mjs` passes `--macos-only`. Dropping that flag makes the
converter emit an iOS target as well. It is not enabled because it needs a
device or simulator to verify, and Bale's web app is not a realistic iOS Safari
target while a native Bale app exists.

## Browsers that are out of scope

- **Internet Explorer, legacy Edge** — no WebExtensions support.
- **Samsung Internet** — supports only a small curated set of add-ons.
- **Chromium browsers below 111 / Firefox below 121** — no `:has()`. The
  manifests state the minimum, so those browsers refuse to install rather than
  installing something half-broken.

Kiwi Browser on Android loads the Chromium zip through its own extension page,
though it is unmaintained; nothing in the extension prevents it.

## How each target was verified

- **Chromium** — end-to-end against a logged-in session driven by
  `scripts/browser.mjs`: every category blurs, timestamps stay readable, hover
  reveals a single element, the master switch and per-category switches
  propagate to open tabs, and the settings survive a browser restart.
- **Firefox** — `web-ext lint` reports zero errors, real Firefox installs the
  package as a temporary add-on without complaint, and a maintainer confirmed
  the blur on a logged-in session:

  ```bash
  npx web-ext run --source-dir dist/firefox --start-url https://web.bale.ai/chat
  ```

- **Safari** — `node scripts/safari.mjs --build` compiles the app and the
  extension. Not run against a live session.

Contributions that close those gaps are welcome; see
[CONTRIBUTING.md](../CONTRIBUTING.md).
