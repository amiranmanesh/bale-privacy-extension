/*
 * Bale Privacy — DOM probe
 * ---------------------------------------------------------------------------
 * Paste this whole file into the DevTools console of an open https://web.bale.ai
 * tab and run `baleProbe()`. It prints a structural map of the page that can be
 * used to write or repair the selectors in src/content/engine/selectors.ts.
 *
 * It never reads message content: text is replaced by a length placeholder
 * before anything is printed or copied, so the output is safe to share.
 *
 *   baleProbe()                       // summary + trees for the known regions
 *   baleProbe({ depth: 8 })           // deeper trees
 *   baleProbe({ selector: '.foo' })   // tree for a specific element
 *   copy(baleProbe.last)              // copy the JSON report to the clipboard
 */
(() => {
  const SENTRY_ATTRS = ['data-sentry-component', 'data-sentry-element', 'data-sentry-source-file'];

  const REGIONS = {
    sidebarRow: [
      '[data-sentry-element="DialogItem"]',
      '[data-sentry-source-file="DialogItemWrapper.tsx"]',
    ],
    messageList: [
      '[data-sentry-component="MessagesListFC"]',
      '[data-sentry-component="NewMessagesList"]',
      '._message-item',
    ],
    messageBody: [
      '[data-sentry-component="MessageContent"]',
      '[data-sentry-element="TextMessage"]',
    ],
    header: ['[data-sentry-component="ToolbarFC"]', '[data-sentry-element="ToolbarContent"]'],
    composer: ['[data-testid="message-text-area"]', '[contenteditable="true"]'],
  };

  /** Replaces any human-readable text with a shape-preserving placeholder. */
  const redact = (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return '';
    return `«${trimmed.length} chars»`;
  };

  const describe = (element) => {
    const parts = { tag: element.tagName.toLowerCase() };
    for (const attr of SENTRY_ATTRS) {
      const value = element.getAttribute(attr);
      if (value) parts[attr.replace('data-sentry-', '')] = value;
    }
    for (const attr of ['data-testid', 'role', 'dir', 'aria-label', 'contenteditable']) {
      const value = element.getAttribute(attr);
      if (value) parts[attr] = attr === 'aria-label' ? redact(value) : value;
    }
    if (element.id) parts.id = element.id;
    const own = [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent)
      .join('');
    if (own.trim()) parts.text = redact(own);
    if (element.tagName === 'IMG') parts.img = element.src.slice(0, 60);
    const box = element.getBoundingClientRect();
    parts.box = `${Math.round(box.width)}x${Math.round(box.height)}`;
    return parts;
  };

  const tree = (element, depth, level = 0) => {
    const node = { ...describe(element), depth: level, children: [] };
    if (level < depth) {
      for (const child of element.children) node.children.push(tree(child, depth, level + 1));
    }
    return node;
  };

  const printTree = (node, indent = '') => {
    const { tag, children, depth: _depth, ...rest } = node;
    const attrs = Object.entries(rest)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');
    console.log(`${indent}${tag} ${attrs}`);
    for (const child of children) printTree(child, `${indent}  `);
  };

  const countAttribute = (attribute) => {
    const counts = new Map();
    for (const element of document.querySelectorAll(`[${attribute}]`)) {
      const value = element.getAttribute(attribute);
      counts.set(value, (counts.get(value) || 0) + 1);
    }
    return Object.fromEntries([...counts].sort((a, b) => b[1] - a[1]));
  };

  const firstMatch = (selectors) => {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return { selector, element };
    }
    return null;
  };

  window.baleProbe = (options = {}) => {
    const depth = options.depth ?? 5;
    const report = {
      url: location.href,
      at: new Date().toISOString(),
      attributes: {},
      regions: {},
    };

    for (const attribute of [...SENTRY_ATTRS, 'data-testid']) {
      report.attributes[attribute] = countAttribute(attribute);
      console.log(
        `%c${attribute}%c — ${Object.keys(report.attributes[attribute]).length} distinct values`,
        'font-weight:bold',
        '',
      );
    }

    const entries = options.selector ? { custom: [options.selector] } : REGIONS;

    for (const [name, selectors] of Object.entries(entries)) {
      const found = firstMatch(selectors);
      if (!found) {
        console.warn(`· ${name}: no match for ${selectors.join(' | ')}`);
        report.regions[name] = null;
        continue;
      }
      console.group(`· ${name} — matched ${found.selector}`);
      const node = tree(found.element, depth);
      printTree(node);
      console.groupEnd();
      report.regions[name] = { selector: found.selector, tree: node };
    }

    window.baleProbe.last = JSON.stringify(report, null, 2);
    console.log('%cRun copy(baleProbe.last) to copy the redacted report.', 'color:#6366f1');
    return report;
  };

  console.log('%cbaleProbe() is ready.', 'color:#6366f1;font-weight:bold');
})();
