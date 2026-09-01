/*
 * Bale Privacy — DOM probe
 * ---------------------------------------------------------------------------
 * Paste this whole file into the DevTools console of an open
 * https://web.bale.ai/chat tab. It reports what the extension can actually
 * anchor on, and why a category is not blurring.
 *
 *   bp.status()     is the extension injected, and which of its selectors are dead
 *   bp.inventory()  every attribute the page renders, with value counts
 *   bp.el($0)       ancestors + subtree of the element you inspected, redacted
 *   bp.report()     status + inventory in one JSON blob
 *   copy(bp.last)   put the last report on the clipboard
 *
 * No message content is ever printed: text is replaced by a «N chars»
 * placeholder, image URLs are truncated, so the output is safe to share.
 */
(() => {
  const STYLE_ID = 'bale-privacy-style';
  const STATE_ATTR = 'data-bale-privacy';
  const SKIP_ATTRS = new Set(['class', 'style']);

  const redact = (text) => {
    const trimmed = (text || '').trim();
    return trimmed ? `«${trimmed.length} chars»` : '';
  };

  /** Attributes are metadata, values may be content: redact the risky ones. */
  const attrValue = (name, value) => {
    if (name === 'src' || name === 'href' || name === 'xlink:href') {
      return `${value.slice(0, 48)}${value.length > 48 ? '…' : ''}`;
    }
    if (name === 'alt' || name === 'title' || name.startsWith('aria-')) return redact(value);
    return value.length > 64 ? `${value.slice(0, 64)}…` : value;
  };

  const describe = (element) => {
    const parts = [element.tagName.toLowerCase()];
    if (element.id) parts.push(`#${element.id}`);
    if (element.classList.length) parts.push(`.${[...element.classList].join('.')}`);
    for (const attr of element.attributes) {
      if (SKIP_ATTRS.has(attr.name)) continue;
      if (attr.name === 'id') continue;
      parts.push(`${attr.name}="${attrValue(attr.name, attr.value)}"`);
    }
    const own = [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent)
      .join('');
    if (own.trim()) parts.push(`text=${redact(own)}`);
    const box = element.getBoundingClientRect();
    parts.push(`box=${Math.round(box.width)}x${Math.round(box.height)}`);
    return parts.join(' ');
  };

  const subtree = (element, depth, indent = '') => {
    const lines = [`${indent}${describe(element)}`];
    if (depth > 0) {
      for (const child of element.children) {
        lines.push(...subtree(child, depth - 1, `${indent}  `));
      }
    }
    return lines;
  };

  const bp = {
    last: '',

    /** Which of the extension's own selectors are matching right now. */
    status(limit = 40) {
      const style = document.getElementById(STYLE_ID);
      const state = document.documentElement.getAttribute(STATE_ATTR);
      const result = {
        injected: Boolean(style),
        stateAttribute: state,
        rules: 0,
        dead: [],
        alive: [],
      };

      console.log(`extension stylesheet present: ${result.injected}`);
      console.log(`${STATE_ATTR} = ${state ?? '(absent)'}`);
      if (!style) {
        console.warn('The content script did not run. Reload the extension, then this tab.');
        return result;
      }

      let rules = [];
      try {
        rules = [...style.sheet.cssRules];
      } catch (error) {
        console.warn('Could not read the stylesheet', error);
        return result;
      }
      result.rules = rules.length;

      const seen = new Set();
      for (const rule of rules) {
        for (const full of (rule.selectorText || '').split(',')) {
          // Strip the html[data-bale-privacy~="…"] gate to get the page selector.
          const selector = full.replace(/^\s*html(\[data-bale-privacy~="[^"]+"\])+\s*/, '').trim();
          if (!selector || seen.has(selector)) continue;
          seen.add(selector);
          let count = 0;
          try {
            count = document.querySelectorAll(selector.replace(/:hover$/, '')).length;
          } catch {
            count = -1;
          }
          (count > 0 ? result.alive : result.dead).push({ selector, count });
        }
      }

      console.log(
        `%c${result.alive.length} selectors match, ${result.dead.length} match nothing`,
        'font-weight:bold',
      );
      if (result.alive.length) console.table(result.alive.slice(0, limit));
      console.log('dead selectors (first %d):', limit);
      console.table(result.dead.slice(0, limit));
      return result;
    },

    /** Every attribute the page actually renders, most common first. */
    inventory(topValues = 12) {
      const byName = new Map();
      for (const element of document.querySelectorAll('*')) {
        for (const attr of element.attributes) {
          if (SKIP_ATTRS.has(attr.name)) continue;
          if (!byName.has(attr.name)) byName.set(attr.name, { count: 0, values: new Map() });
          const entry = byName.get(attr.name);
          entry.count += 1;
          entry.values.set(attr.value, (entry.values.get(attr.value) || 0) + 1);
        }
      }

      const rows = [...byName.entries()]
        .map(([name, entry]) => ({
          attribute: name,
          elements: entry.count,
          distinct: entry.values.size,
          top: [...entry.values.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, topValues)
            .map(([value, n]) => `${value.slice(0, 40)}(${n})`)
            .join(', '),
        }))
        .sort((a, b) => b.elements - a.elements);

      console.table(rows);
      return rows;
    },

    /** Ancestors and subtree of an element — use bp.el($0) after inspecting one. */
    el(element, { up = 8, depth = 4 } = {}) {
      if (!element) {
        console.warn('Inspect an element first (right-click → Inspect), then run bp.el($0)');
        return null;
      }
      const chain = [];
      let node = element.parentElement;
      while (node && chain.length < up) {
        chain.unshift(describe(node));
        node = node.parentElement;
      }
      const lines = [
        '── ancestors ──',
        ...chain.map((line, i) => `${'  '.repeat(i)}${line}`),
        '── element + subtree ──',
        ...subtree(element, depth),
      ];
      console.log(lines.join('\n'));
      bp.last = lines.join('\n');
      return bp.last;
    },

    report() {
      const payload = {
        url: location.href,
        at: new Date().toISOString(),
        userAgent: navigator.userAgent,
        status: bp.status(),
        inventory: bp.inventory(),
      };
      bp.last = JSON.stringify(payload, null, 2);
      console.log('%cRun copy(bp.last) to copy the report.', 'color:#6366f1');
      return payload;
    },
  };

  window.bp = bp;
  console.log(
    '%cbp ready.%c  bp.status() · bp.inventory() · bp.el($0) · bp.report()',
    'color:#6366f1;font-weight:bold',
    '',
  );
})();
