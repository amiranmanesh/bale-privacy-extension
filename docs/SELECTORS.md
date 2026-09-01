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

The bundle is built with Sentry's component-annotate plugin, which leaves three
attributes on the rendered elements, all derived from source code names rather
than from the build:

```html
<div
  data-sentry-component="MessagesListFC"
  data-sentry-element="DialogItem"
  data-sentry-source-file="DialogItemWrapper.tsx"
></div>
```

A handful of `data-testid` attributes and one hand-written class,
`._message-item`, survive minification too. Together they are the anchor set
used by `src/content/engine/selectors.ts`.

They are stable, not permanent: renaming `DialogItemWrapper.tsx` upstream will
break the sidebar category. That is why the options page lets any user add
their own selectors without waiting for a release.

## The region + leaf pattern

Most entries in the registry are a container we trust, followed by the leaf
pattern:

```
*:not(:empty, img, svg, canvas, video, input, textarea, br):not(:has(*))
```

"Leaf" means _no element children_, which in practice means the element that
directly holds text. Blurring leaves rather than containers avoids creating a
containing block around Bale's fixed-position menus, and keeps the categories
independent of each other.

`:has()` is written last in the compound on purpose: some selector engines
(including jsdom, which the test suite uses to parse every shipped selector)
reject it in the middle of a `:not()` chain.

## Checking the registry against a live page

### 1. Debug mode

Options page → _Advanced selectors_ → **Log selector diagnostics**. Reload
`web.bale.ai`; the page console then prints a table of every selector with the
number of elements it matches. A row with `0` is a dead anchor.

### 2. The DOM probe

`tools/dom-probe.js` is a standalone console snippet. Paste it into DevTools on
an open Bale tab and run:

```js
baleProbe(); // summary + a redacted tree for each known region
baleProbe({ depth: 8 });
copy(baleProbe.last); // JSON report on the clipboard
```

It counts every distinct value of the three `data-sentry-*` attributes and of
`data-testid`, then prints a structural tree of each region. **All text is
replaced with a `«N chars»` placeholder before printing**, so the output can be
attached to a bug report.

### 3. Re-deriving anchors from the bundle

The attributes can also be recovered without logging in:

```bash
curl -s https://web.bale.ai/chat -o page.html
grep -oE 'src="[^"]+\.js"' page.html          # entry chunks
# the chunk name/hash maps live in the `.u=` expression of index.*.js;
# async chunks are served from https://web.bale.ai/static/js/async/<name>.<hash>.js
grep -ohE '"data-sentry-component":"[^"]+"' *.js | sort -u
```

## Adding a selector as a user

Options page → _Advanced selectors_, one selector per line under the category
it belongs to. Input is validated before it reaches the stylesheet:

- braces, `<`, `;`, `@`, backslashes and comment markers are rejected — they
  could terminate the rule and inject arbitrary CSS;
- **commas are rejected** as well, because every custom selector is prefixed
  with the extension's state gate and a comma would let the second half escape
  that prefix and blur the whole page;
- at most 20 selectors per category, 200 characters each.

## Adding a selector as a contributor

1. Add it to the right entry in `src/content/engine/selectors.ts`, ordered from
   most specific to broadest.
2. `npm test` — the suite asserts that every selector parses and that each
   target keeps exactly one registry entry.
3. Mention in the pull request which Bale build you verified it against.
