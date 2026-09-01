# Selectors: how they were derived and how to repair them

## The problem

Bale Web is a React app bundled with webpack and CSS Modules. Every class name
in the DOM is a per-build hash:

```
_BKsFW  _CZcwB  _Xg6NN  _oru8E
```

Those change on every deploy, so an extension built on them breaks roughly as
often as Bale ships.

## What is stable

Three attribute families survive a rebuild. They are listed here in decreasing
order of trust, which is also the order the registry prefers them in.

### 1. `aria-label` — the strongest anchor

Written by hand for accessibility, semantic, and rarely churned:

| value                   | what it marks                                 |
| ----------------------- | --------------------------------------------- |
| `dialog-item`           | one row in the sidebar chat list              |
| `message-item`          | one message row in the open conversation      |
| `avatar`                | any avatar container, anywhere                |
| `member-dialog`         | one person row in the profile / members panel |
| `ChatAppBar`            | the header above the open conversation        |
| `editable-message-text` | the composer                                  |
| `count-badge-text`      | unread counter — deliberately _not_ blurred   |

### 2. `data-sentry-source-file` / `data-sentry-component`

Emitted by Sentry's component-annotate plugin and derived from source names:

| value                                                 | what it marks                            |
| ----------------------------------------------------- | ---------------------------------------- |
| `Dialog.tsx`                                          | sidebar chat row                         |
| `BaseBubble.tsx` / `BaseBubbleFC`                     | message bubble                           |
| `Text.tsx` / `NewTextContainerFC`                     | message text (and quoted reply text)     |
| `Preview.tsx`                                         | reply / link preview block               |
| `Media.preview.tsx`, `Thumbnail.tsx`, `Photo.new.tsx` | media                                    |
| `MessageBottom.tsx`, `Info.tsx`                       | timestamp row — deliberately not blurred |
| `SmallDialog.tsx`, `GroupInfo.tsx`                    | profile and members panel                |

### 3. `data-testid`

A handful of nodes: `photo-message`, `thumbnail`, `story-item`,
`virtuoso-scroller`.

## Structures worth knowing

These are the shapes the registry relies on; they are what a repair has to
re-derive if Bale changes them.

```html
<!-- sidebar row -->
<div aria-label="dialog-item" data-sentry-source-file="Dialog.tsx">
  <div aria-label="avatar">…</div>
  <div>
    <div>
      <div><bdi>chat name</bdi></div>
      <span>12:04</span>
    </div>
    <div title="…">
      <div>
        <div dir="rtl"><span>last message</span></div>
      </div>
    </div>
  </div>
</div>

<!-- a group preview is prefixed with the last sender -->
<div><span dir="auto">Sender</span>:&nbsp;</div>

<!-- message -->
<div aria-label="message-item" data-sid="client-message:…">
  <div aria-label="avatar">…</div>
  <div data-sentry-source-file="BaseBubble.tsx">
    <p><span>sender name</span></p>
    <!-- groups only -->
    <div data-sentry-source-file="Preview.tsx">…</div>
    <div data-sentry-source-file="Text.tsx">…</div>
    <div data-sentry-source-file="Info.tsx"><p>12:05</p></div>
  </div>
</div>
```

Two details that the selectors depend on:

- The sender name is the only `p` **wrapping a span**; the timestamp `p` under
  `Info.tsx` holds its text directly. That is what keeps timestamps readable.
- Message text can contain inline markup (`<strong>`, links), so the _container_
  is blurred rather than its leaves.

## Verifying against a live page

### With the driven browser (preferred)

`scripts/browser.mjs` launches Chromium with the built extension loaded and a
persistent profile in `.browser-profile/`, so you log in once:

```bash
npm run build
npm run browser                      # log in, leave the window open
node scripts/browser.mjs eval probe-out/verify.js
node scripts/browser.mjs shot probe-out/page.png
node scripts/browser.mjs hover '[data-sentry-source-file="Text.tsx"]'
node scripts/browser.mjs extension options.html probe-out/options.png
```

The most useful snippet is a leak scan: walk every element that renders text
inside a `dialog-item` or `message-item`, skip the ones with a blurred
ancestor, and group what is left by its DOM path. Anything that comes back and
is not a timestamp, an unread badge or a reply count is a hole in the registry.

### With the console probe

`tools/dom-probe.js` needs no tooling — paste it into DevTools on a Bale tab:

```js
bp.status(); // dead vs matching selectors, read from the injected stylesheet
bp.inventory(); // every attribute the page renders, with value counts
bp.el($0); // ancestors + subtree of the inspected element
copy(bp.last);
```

All text and any attribute that can carry content (`src`, `alt`, `title`,
`aria-*` values) is replaced with a `«N chars»` placeholder before printing, so
the output is safe to attach to a bug report.

### With debug mode

Options page → _Advanced selectors_ → **Log selector diagnostics**, then reload
`web.bale.ai`. The page console prints a table of every selector and how many
elements it matches; a row with `0` is a dead anchor.

## Adding a selector as a user

Options page → _Advanced selectors_, one selector per line under the category it
belongs to. Input is validated before it reaches the stylesheet:

- braces, `<`, `;`, `@`, backslashes and comment markers are rejected — they
  could terminate the rule and inject arbitrary CSS;
- **commas are rejected** as well, because every custom selector is prefixed
  with the extension's state gate and a comma would let the second half escape
  that prefix and blur the whole page;
- at most 20 selectors per category, 200 characters each.

## Adding a selector as a contributor

1. Add it to the right entry in `src/content/engine/selectors.ts`. Picture-only
   selectors go in `mediaSelectors`, which get the stronger graphic blur under
   the same user-facing switch.
2. `npm test` — the suite parses every shipped selector and checks the targeting
   rules against a fixture transcribed from the real markup.
3. Verify on a live page with the driven browser, and say in the pull request
   which Bale build you checked against.
