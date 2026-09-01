import { STATE_ATTRIBUTE, STYLE_ELEMENT_ID } from '../../common/constants.js';

/**
 * Owns every mutation the extension makes to the host page: exactly one
 * <style> element and one attribute plus a few custom properties on <html>.
 *
 * Keeping the footprint that small means `dispose()` can restore the page to
 * its original state with certainty, and that nothing we do can be mistaken
 * for the page's own markup.
 */
export class StyleController {
  private styleElement: HTMLStyleElement | null = null;
  private guard: MutationObserver | null = null;
  private appliedVars = new Set<string>();

  constructor(private readonly root: HTMLElement = document.documentElement) {}

  /** Creates (or re-creates) the style element and fills it with `css`. */
  setStylesheet(css: string): void {
    const element = this.ensureStyleElement();
    if (element.textContent !== css) element.textContent = css;
  }

  /** Rewrites the state token list; a no-op when nothing changed. */
  setTokens(tokens: string[]): void {
    const value = tokens.join(' ');
    if (this.root.getAttribute(STATE_ATTRIBUTE) === value) return;
    if (value.length === 0) this.root.removeAttribute(STATE_ATTRIBUTE);
    else this.root.setAttribute(STATE_ATTRIBUTE, value);
  }

  setVars(vars: Record<string, string>): void {
    for (const [name, value] of Object.entries(vars)) {
      this.root.style.setProperty(name, value);
      this.appliedVars.add(name);
    }
  }

  /** Removes every trace of the extension from the page. */
  dispose(): void {
    this.guard?.disconnect();
    this.guard = null;
    this.styleElement?.remove();
    this.styleElement = null;
    this.root.removeAttribute(STATE_ATTRIBUTE);
    for (const name of this.appliedVars) this.root.style.removeProperty(name);
    this.appliedVars.clear();
  }

  private ensureStyleElement(): HTMLStyleElement {
    if (this.styleElement?.isConnected) return this.styleElement;

    const existing = document.getElementById(STYLE_ELEMENT_ID);
    if (existing instanceof HTMLStyleElement) {
      this.styleElement = existing;
      return existing;
    }

    const element = document.createElement('style');
    element.id = STYLE_ELEMENT_ID;
    element.setAttribute('type', 'text/css');
    // Appending to <html> rather than <head> means the stylesheet is in place
    // at document_start, before the app has created <head> children, and stays
    // last in document order so it wins specificity ties.
    this.root.append(element);
    this.styleElement = element;
    this.installGuard();
    return element;
  }

  /**
   * A single-page app can replace large parts of the document. If our style
   * element disappears, put it back instead of silently unblurring the page.
   */
  private installGuard(): void {
    if (this.guard) return;
    this.guard = new MutationObserver(() => {
      if (this.styleElement && !this.styleElement.isConnected) {
        this.root.append(this.styleElement);
      }
    });
    this.guard.observe(this.root, { childList: true });
  }
}
