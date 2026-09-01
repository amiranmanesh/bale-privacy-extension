# Security policy

## Reporting a vulnerability

Please report security issues privately by opening a GitHub security advisory on
this repository rather than a public issue. Expect an acknowledgement within a
week.

## Threat model

The extension has a deliberately small attack surface: one `storage` permission,
one content script, no network access and no runtime dependencies. The
interesting boundaries are:

- **Custom selectors.** User input from the options page is concatenated into a
  generated stylesheet. `isSafeSelector()` rejects braces, `<`, `;`, `@`,
  backslashes, comment markers and commas, and caps length and count. A comma is
  rejected specifically because every custom selector is prefixed with the
  extension's state gate; without that rule, `.foo, *` would escape the prefix
  and blur (and disable text selection on) the entire page.
- **Imported settings.** Any imported JSON goes through the same
  `migrateSettings()`/`sanitizeSettings()` path as stored settings, so a
  hand-edited file can only produce in-range values.
- **The injected stylesheet itself.** It only sets `filter`, `transition`,
  `transition-delay` and `user-select`. It cannot exfiltrate anything, and
  removing the extension restores the page exactly.

## What is out of scope

The extension protects against shoulder surfing and accidental exposure while
sharing a screen. It is not a defence against malware on your machine, a
compromised browser profile, or anyone with access to your Bale account.
