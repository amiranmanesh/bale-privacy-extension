/*
 * Bale Privacy — leak scan
 * ---------------------------------------------------------------------------
 * Finds private text the blur is missing.
 *
 * Paste into the DevTools console of a Bale tab with the extension active, or
 * run it through the driven browser:
 *
 *   node scripts/browser.mjs eval tools/leak-scan.js
 *
 * It walks every element that renders text inside a chat row or a message,
 * skips the ones with a blurred ancestor, and groups whatever is left by its
 * DOM path. A clean run reports only the things left sharp on purpose:
 * timestamps (Info.tsx), unread badges (count-badge-text) and reply counts.
 *
 * Only counts and DOM paths are printed — never message content.
 */
(() => {
  const ROOTS =
    '[aria-label="dialog-item"], [aria-label="message-item"], [aria-label="member-dialog"]';

  const isBlurred = (element) => {
    for (let node = element; node && node !== document.documentElement; node = node.parentElement) {
      const { filter } = getComputedStyle(node);
      if (filter && filter !== 'none' && filter.includes('blur')) return true;
    }
    return false;
  };

  const path = (element) => {
    const parts = [];
    let node = element;
    for (let depth = 0; node && depth < 5; depth += 1, node = node.parentElement) {
      let step = node.tagName.toLowerCase();
      const label = node.getAttribute('aria-label');
      if (label) step += `[aria-label=${label}]`;
      const file = node.getAttribute('data-sentry-source-file');
      if (file) step += `[${file}]`;
      const testid = node.getAttribute('data-testid');
      if (testid) step += `[testid=${testid}]`;
      parts.unshift(step);
    }
    return parts.join(' > ');
  };

  const leaks = new Map();
  for (const root of document.querySelectorAll(ROOTS)) {
    for (const element of root.querySelectorAll('*')) {
      const ownText = [...element.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent)
        .join('')
        .trim();
      if (!ownText || isBlurred(element)) continue;

      const box = element.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;

      const key = path(element);
      leaks.set(key, (leaks.get(key) ?? 0) + 1);
    }
  }

  const unblurredMedia = [...document.querySelectorAll(`${ROOTS.split(', ').join(' img, ')} img`)]
    .filter((image) => !isBlurred(image))
    .map(path);

  const rows = [...leaks.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([where, count]) => ({ count, where }));

  console.table(rows);
  if (unblurredMedia.length > 0) console.warn('unblurred images:', unblurredMedia);
  return { textLeaks: rows, unblurredMedia };
})();
