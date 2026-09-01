/**
 * Native tooltips leak what the blur hides.
 *
 * Bale puts the full last-message preview in a `title` attribute on the chat
 * row. The browser renders that as a tooltip on hover, outside the page's own
 * styling, so CSS cannot blur it. With reveal-on-hover enabled that does not
 * matter — hovering reveals the row anyway — but with it disabled the tooltip
 * would hand over exactly the text the user asked to hide.
 *
 * The guard stashes the attribute the first time the pointer reaches an element
 * that has one, and puts every stashed value back when it is switched off. It
 * costs one delegated listener and no DOM walking on the hot path: nothing
 * happens until a pointer actually enters a titled element.
 */

const STASH_ATTRIBUTE = 'data-bale-privacy-title';

/** Rows whose tooltips carry conversation content. */
const GUARDED_CONTAINERS = [
  '[aria-label="dialog-item"]',
  '[aria-label="message-item"]',
  '[aria-label="member-dialog"]',
  '[data-sentry-source-file="Dialog.tsx"]',
].join(',');

export class TooltipGuard {
  private enabled = false;

  constructor(private readonly target: Document = document) {}

  setEnabled(enabled: boolean): void {
    if (enabled === this.enabled) return;
    this.enabled = enabled;

    if (enabled) {
      this.target.addEventListener('pointerover', this.handlePointerOver, {
        capture: true,
        passive: true,
      });
    } else {
      this.target.removeEventListener('pointerover', this.handlePointerOver, { capture: true });
      this.restoreAll();
    }
  }

  dispose(): void {
    this.setEnabled(false);
  }

  private readonly handlePointerOver = (event: Event): void => {
    const start = event.target;
    if (!(start instanceof Element)) return;

    const titled = start.closest('[title]');
    if (!titled || !titled.closest(GUARDED_CONTAINERS)) return;

    const title = titled.getAttribute('title');
    if (title === null) return;

    titled.setAttribute(STASH_ATTRIBUTE, title);
    titled.removeAttribute('title');
  };

  /**
   * Restores from the DOM rather than from a remembered list, so a tooltip is
   * put back even if the guard that stashed it is long gone — a page that
   * outlives an instance never keeps a swallowed tooltip.
   */
  private restoreAll(): void {
    for (const element of this.target.querySelectorAll(`[${STASH_ATTRIBUTE}]`)) {
      const title = element.getAttribute(STASH_ATTRIBUTE);
      if (title !== null) element.setAttribute('title', title);
      element.removeAttribute(STASH_ATTRIBUTE);
    }
  }
}
