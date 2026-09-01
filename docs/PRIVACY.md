# Privacy policy

_Last updated: 2026-09-01_

**Privacy for Bale Web does not collect, transmit, store or sell any personal
data.**

## What the extension does

It injects a stylesheet into `https://web.bale.ai/*` that blurs parts of the
page, and it stores your preferences.

## What it stores

One object under the key `settings` in the browser's extension storage
(`storage.sync`, falling back to `storage.local`): which categories are blurred,
the blur radius, the reveal options, the automatic-blur options and any custom
CSS selectors you added.

If your browser profile is signed in and syncing extension data, that object is
synchronised by the browser itself, exactly like any other extension setting.
It is never sent to the extension's authors or to any third party — there is no
third party.

## What it never touches

- It does not read, copy, log or transmit your messages, contacts, media or
  account details. The blur is CSS; the extension does not need to know what is
  on the page in order to blur it.
- It makes **no network requests at all**. There is no server, no analytics, no
  crash reporting, no remote configuration and no remotely hosted code.
- It does not use cookies, and it does not read or modify any page other than
  `web.bale.ai`.

## Permissions

| permission                                | why                                                          |
| ----------------------------------------- | ------------------------------------------------------------ |
| `storage`                                 | Save your settings and let every open tab react to a change. |
| content script on `https://web.bale.ai/*` | Inject the stylesheet that performs the blur.                |

There are no host permissions, no `tabs` permission and no `activeTab`
permission. The popup and the options page communicate with open tabs purely
through storage change events.

## Diagnostics

The optional _Log selector diagnostics_ setting prints how many elements each
selector matches to your own browser console. It prints counts, never content,
and nothing leaves your machine.

`tools/dom-probe.js`, used when reporting a broken selector, replaces every
piece of text with a `«N chars»` placeholder before printing.

## Source code

The extension is open source under the MIT license and the published packages
are built from the tagged sources by a public CI workflow.

## Contact

Please open an issue in the repository for any privacy question.
