# Architecture

## Goals that shaped the design

1. **Minimum permissions.** The extension asks for `storage` and nothing else —
   no `tabs`, no `activeTab`, no host permissions. That is both a privacy
   property and the fastest path through store review.
2. **No per-element JavaScript.** A messenger renders thousands of nodes and
   re-renders constantly. Anything that walks the DOM on every mutation would
   show up as jank. The blur is therefore pure CSS.
3. **Survive Bale's redeploys.** Class names are per-build hashes, so nothing
   may depend on them.
4. **One codebase, two stores.** Chrome and Firefox differ in exactly one
   manifest field; that difference lives in the build script, not in the code.

## Module map

```
src/
  common/          shared by every context
    browser.ts       picks browser.* or chrome.*, no polyfill dependency
    constants.ts     storage keys, attribute names, state tokens
    types.ts         TargetId union, Settings shape
    settings.ts      defaults, clamping/validation, schema migration
    storage.ts       typed storage access + change subscription
  content/
    index.ts         entry point: wire settings and live state to the DOM
    engine/
      selectors.ts     the target registry (what to blur, and where it lives)
      cssBuilder.ts    pure functions: settings -> stylesheet, tokens, CSS vars
      styleController.ts  the only code that mutates the host page
      activityWatcher.ts  window focus, idle timer, hold-to-peek key
      diagnostics.ts   selector match counts, for debug mode
  background/
    index.ts         install defaults, handle the keyboard command
  ui/
    dom.ts           i18n + small DOM helpers
    popup/           quick switches
    options/         full settings surface
```

## Data flow

```
        popup / options page            background (command)
                 │                              │
                 └──────────► storage.sync ◄────┘
                                   │
                       storage.onChanged (broadcast)
                                   │
                    ┌──────────────┴──────────────┐
              content script                content script
              (tab A)                       (tab B)
```

Storage is the only cross-context channel. Nothing sends a runtime message to a
tab, which is precisely why no `tabs` permission is needed and why every open
Bale tab — including background ones — stays consistent.

## The rendering model

The content script writes two things and nothing else:

```html
<html
  data-bale-privacy="active animate hover messageText messageMedia …"
  style="--bale-privacy-radius: 11px; --bale-privacy-text-radius: 6px; …"
>
  …
  <style id="bale-privacy-style">
    …
  </style>
</html>
```

`buildStylesheet()` emits four blocks per target:

| block        | selector shape                            | effect                               |
| ------------ | ----------------------------------------- | ------------------------------------ |
| blur         | `html[…~="active"][…~="messageText"] SEL` | `filter: blur(var(--…))`             |
| transition   | `…[…~="animate"]…`                        | fades the filter                     |
| hover reveal | `…[…~="hover"]… SEL:hover`                | `filter: none`                       |
| peek reveal  | `html[…~="peek"] SEL`                     | `filter: none`, wins by source order |

Consequences worth knowing:

- **Toggling a category is one attribute write.** The stylesheet is only
  rebuilt when the user's _custom_ selectors change, because nothing else in it
  depends on the settings.
- **New nodes are blurred before they paint.** The rules already exist, so a
  message that arrives in a re-render is styled by the engine, not by us.
- **Removing the extension restores the page exactly.** `StyleController.dispose()`
  removes one element, one attribute and the custom properties.

### Why `filter`, and why leaves

`filter: blur()` keeps the original colours and works in both light and dark
themes, but it creates a containing block for `position: fixed` descendants.
Blurring a large layout container would therefore move Bale's menus and popovers.

The registry avoids that by selecting _leaves_ — elements with no element
children:

```css
[data-sentry-element="DialogItem"]
  *:not(:empty, img, svg, canvas, video, input, textarea, br):not(:has(*))
```

Text nodes get blurred; the containers that position menus do not. It also
keeps categories independent: blurring chat-list text does not blur the avatar
next to it, so the two switches genuinely act on their own.

`:has()` sets the browser baseline: Chromium 111 and Firefox 121, both declared
in the generated manifests.

### The one thing CSS cannot reach

Bale puts the full last-message preview into a `title` attribute on the chat
row, and the browser renders that as a native tooltip — outside the page, where
no stylesheet can touch it. With reveal-on-hover enabled it does not matter,
since hovering reveals the row anyway; with it disabled the tooltip would hand
over exactly the text the user asked to hide.

`TooltipGuard` closes that hole with one delegated `pointerover` listener, armed
only while blurring is active _and_ hover reveal is off. It moves the attribute
aside the first time the pointer reaches a titled row, and restores everything
by querying the DOM when it is switched off — so a tooltip is put back even if
the instance that stashed it is gone.

### Forced blur

`computeStateTokens()` treats "window lost focus" and "user is idle" as
_forced_ states: they switch blurring on even when the master switch is off,
and they suppress hover and peek. Walking away from the screen must always
hide everything, regardless of how the extension was left configured.

## Build

`scripts/build.mjs` runs esbuild once per target, producing classic IIFE
bundles (MV3 forbids ESM content scripts), copies the static UI files, locales
and icons, and writes a manifest from `scripts/manifest.mjs`.

The only per-target difference is the background field — a service worker on
Chrome, a script list on Firefox — plus the Firefox add-on id and minimum
versions. `src/manifest/hosts.json` holds the host match and is read by both the
manifest generator and the TypeScript constants, so the two can never drift.
