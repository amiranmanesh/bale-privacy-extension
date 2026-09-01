import hosts from '../manifest/hosts.json';

/** Storage key holding the whole settings object. */
export const SETTINGS_KEY = 'settings';

/** Attribute written on `<html>`; its value is a space separated token list. */
export const STATE_ATTRIBUTE = 'data-bale-privacy';

/** `id` of the single <style> element the content script injects. */
export const STYLE_ELEMENT_ID = 'bale-privacy-style';

/** CSS custom property names used by the generated stylesheet. */
export const CSS_VARS = {
  radius: '--bale-privacy-radius',
  textRadius: '--bale-privacy-text-radius',
  transition: '--bale-privacy-transition',
  revealDelay: '--bale-privacy-reveal-delay',
} as const;

/** State tokens written into {@link STATE_ATTRIBUTE}. */
export const STATE_TOKENS = {
  /** Blurring is currently applied. */
  active: 'active',
  /** Hovering a blurred element reveals it. */
  hover: 'hover',
  /** The hold-to-reveal key is currently pressed: reveal everything. */
  peek: 'peek',
  /** Smooth transitions are enabled. */
  animate: 'animate',
} as const;

/**
 * Hosts the content script is allowed to run on.
 * Single source of truth, also read by scripts/manifest.mjs at build time.
 */
export const BALE_MATCHES: readonly string[] = hosts.matches;

/** Command id registered in the manifest for the global keyboard shortcut. */
export const TOGGLE_COMMAND = 'toggle-privacy';
