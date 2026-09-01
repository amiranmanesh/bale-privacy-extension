/**
 * Cross-browser entry point to the WebExtension API.
 *
 * Firefox exposes `browser.*` (promise based) and Chrome exposes `chrome.*`
 * (promise based since MV3). Picking whichever exists keeps a single build of
 * the shared code working on both engines without a polyfill dependency.
 */
const api: WebExt.Api | undefined =
  typeof browser !== 'undefined' && browser?.storage
    ? browser
    : typeof chrome !== 'undefined'
      ? chrome
      : undefined;

if (!api) {
  throw new Error('bale-privacy: no WebExtension API available in this context');
}

export const ext: WebExt.Api = api;

/** True when running inside an extension context (as opposed to a unit test). */
export const hasExtensionContext = (): boolean => Boolean(ext.runtime?.id);

/**
 * Localised string with a safe fallback, so the UI never renders raw
 * `__MSG_key__` placeholders if a locale file is missing an entry.
 */
export const t = (key: string, fallback = key): string => {
  const value = ext.i18n?.getMessage(key);
  return value && value.length > 0 ? value : fallback;
};
