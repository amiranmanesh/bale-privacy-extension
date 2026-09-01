import { ext, t } from '../common/browser.js';

/**
 * Applies the UI locale to a static HTML document.
 *
 * Every translatable node carries `data-i18n` (text) or `data-i18n-title`
 * (tooltip) so that the markup stays free of hard-coded English and the same
 * files serve both the English and Persian builds.
 */
export const localizeDocument = (doc: Document = document): void => {
  const direction = ext.i18n?.getMessage('@@bidi_dir');
  doc.documentElement.dir = direction === 'rtl' ? 'rtl' : 'ltr';
  doc.documentElement.lang = ext.i18n?.getUILanguage?.() ?? 'en';

  for (const node of doc.querySelectorAll<HTMLElement>('[data-i18n]')) {
    const key = node.dataset.i18n;
    if (key) node.textContent = t(key, node.textContent ?? key);
  }
  for (const node of doc.querySelectorAll<HTMLElement>('[data-i18n-title]')) {
    const key = node.dataset.i18nTitle;
    if (key) node.title = t(key, node.title);
  }
};

export interface SwitchRow {
  row: HTMLDivElement;
  input: HTMLInputElement;
}

/** Builds one label + toggle row, matching the markup used in the static pages. */
export const createSwitchRow = (id: string, label: string, hint?: string): SwitchRow => {
  const row = document.createElement('div');
  row.className = 'bp-row';

  const labelWrap = document.createElement('label');
  labelWrap.className = 'bp-row__label';
  labelWrap.htmlFor = id;
  labelWrap.append(document.createTextNode(label));
  if (hint) {
    const hintNode = document.createElement('span');
    hintNode.className = 'bp-hint';
    hintNode.textContent = hint;
    labelWrap.append(hintNode);
  }

  const toggle = document.createElement('span');
  toggle.className = 'bp-switch';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = id;
  // Without this the browser restores the control's previous state when the
  // page is reopened or restored, firing a change event that would overwrite
  // the saved settings with stale form data.
  input.autocomplete = 'off';

  const track = document.createElement('span');
  track.className = 'bp-switch__track';

  toggle.append(input, track);
  row.append(labelWrap, toggle);
  return { row, input };
};

/** Type-safe `getElementById` that fails loudly instead of returning null. */
export const requireElement = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`bale-privacy: missing element #${id}`);
  return element as T;
};
