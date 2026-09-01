import { ext } from './browser.js';
import { SETTINGS_KEY } from './constants.js';
import { DEFAULT_SETTINGS, migrateSettings } from './settings.js';
import type { Settings } from './types.js';

/**
 * `storage.sync` roams settings between a user's browsers, which is what people
 * expect from a preferences panel. It is unavailable in a few configurations
 * (Firefox without an account, enterprise policy), so fall back to `local`.
 */
const area = (): WebExt.StorageArea => ext.storage.sync ?? ext.storage.local;

export const loadSettings = async (): Promise<Settings> => {
  try {
    const stored = await area().get(SETTINGS_KEY);
    return migrateSettings(stored[SETTINGS_KEY]);
  } catch (error) {
    console.warn('bale-privacy: falling back to default settings', error);
    return { ...DEFAULT_SETTINGS };
  }
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  await area().set({ [SETTINGS_KEY]: settings });
};

/**
 * Applies a partial update on top of the persisted value.
 * Returns the settings that were actually written.
 */
export const patchSettings = async (patch: Partial<Settings>): Promise<Settings> => {
  const current = await loadSettings();
  const next = migrateSettings({ ...current, ...patch });
  await saveSettings(next);
  return next;
};

export const resetSettings = async (): Promise<Settings> => {
  const next = { ...DEFAULT_SETTINGS };
  await saveSettings(next);
  return next;
};

/**
 * Subscribes to settings changes.
 *
 * This is the extension's only cross-context channel: the popup writes to
 * storage and every content script reacts. It avoids the `tabs` permission and
 * keeps all surfaces consistent even in background tabs.
 */
export const onSettingsChanged = (listener: (settings: Settings) => void): (() => void) => {
  const handler = (changes: Record<string, WebExt.StorageChange>): void => {
    const change = changes[SETTINGS_KEY];
    if (!change) return;
    listener(migrateSettings(change.newValue));
  };
  ext.storage.onChanged.addListener(handler);
  return () => ext.storage.onChanged.removeListener(handler);
};
