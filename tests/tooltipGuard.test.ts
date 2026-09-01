// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TooltipGuard } from '../src/content/engine/tooltipGuard.js';

// jsdom has no PointerEvent constructor; the guard only reads event.target, so
// a bubbling Event of the same type is a faithful stand-in.
const hover = (element: Element): void => {
  element.dispatchEvent(new Event('pointerover', { bubbles: true }));
};

describe('TooltipGuard', () => {
  let guard: TooltipGuard;

  beforeEach(() => {
    document.body.innerHTML = `
      <div aria-label="dialog-item">
        <div id="row" title="see you tomorrow"><span id="preview">see you tomorrow</span></div>
      </div>
      <div id="outside" title="keep me">
        <span id="outside-child">x</span>
      </div>
    `;
    guard = new TooltipGuard();
  });

  afterEach(() => {
    guard.dispose();
  });

  it('does nothing while disabled', () => {
    hover(document.getElementById('preview')!);
    expect(document.getElementById('row')?.getAttribute('title')).toBe('see you tomorrow');
  });

  it('removes the tooltip of a hovered chat row', () => {
    guard.setEnabled(true);
    hover(document.getElementById('preview')!);
    const row = document.getElementById('row')!;
    expect(row.hasAttribute('title')).toBe(false);
    expect(row.getAttribute('data-bale-privacy-title')).toBe('see you tomorrow');
  });

  it('leaves tooltips outside a conversation row alone', () => {
    guard.setEnabled(true);
    hover(document.getElementById('outside-child')!);
    expect(document.getElementById('outside')?.getAttribute('title')).toBe('keep me');
  });

  it('puts every tooltip back when switched off', () => {
    guard.setEnabled(true);
    hover(document.getElementById('preview')!);
    guard.setEnabled(false);

    const row = document.getElementById('row')!;
    expect(row.getAttribute('title')).toBe('see you tomorrow');
    expect(row.hasAttribute('data-bale-privacy-title')).toBe(false);
  });

  it('stops reacting once disposed', () => {
    guard.setEnabled(true);
    guard.dispose();
    hover(document.getElementById('preview')!);
    expect(document.getElementById('row')?.getAttribute('title')).toBe('see you tomorrow');
  });
});
