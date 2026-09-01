import { ext } from '../common/browser.js';
import { TOGGLE_COMMAND } from '../common/constants.js';
import { loadSettings, patchSettings, saveSettings } from '../common/storage.js';

/**
 * Background worker.
 *
 * It has exactly two jobs: write default settings on install, and flip the
 * master switch when the keyboard shortcut fires. Content scripts pick both up
 * through storage.onChanged, which is why the extension needs no `tabs` or host
 * permission to control every open Bale tab.
 */

ext.runtime.onInstalled.addListener((details) => {
  void (async () => {
    // Normalises whatever is in storage (including nothing at all) to a
    // complete, current-schema settings object.
    const settings = await loadSettings();
    await saveSettings(settings);

    if (details.reason === 'install') {
      await ext.runtime.openOptionsPage?.().catch(() => undefined);
    }
  })();
});

ext.commands?.onCommand.addListener((command) => {
  if (command !== TOGGLE_COMMAND) return;
  void (async () => {
    const current = await loadSettings();
    await patchSettings({ enabled: !current.enabled });
  })();
});
