import { ext, t } from '../../common/browser.js';
import { isSafeSelector } from '../../common/settings.js';
import {
  loadSettings,
  onSettingsChanged,
  patchSettings,
  resetSettings,
  saveSettings,
} from '../../common/storage.js';
import { migrateSettings } from '../../common/settings.js';
import type { HoldKey, Settings, TargetId } from '../../common/types.js';
import { TARGET_DEFINITIONS } from '../../content/engine/selectors.js';
import { createSwitchRow, localizeDocument, requireElement } from '../dom.js';

/** Full settings surface. Like the popup, it only ever reads and writes storage. */

const el = {
  enabled: requireElement<HTMLInputElement>('enabled'),
  blurRadius: requireElement<HTMLInputElement>('blurRadius'),
  blurRadiusValue: requireElement<HTMLOutputElement>('blurRadiusValue'),
  animate: requireElement<HTMLInputElement>('animate'),
  revealOnHover: requireElement<HTMLInputElement>('revealOnHover'),
  revealDelayMs: requireElement<HTMLInputElement>('revealDelayMs'),
  holdKeyReveal: requireElement<HTMLInputElement>('holdKeyReveal'),
  holdKey: requireElement<HTMLSelectElement>('holdKey'),
  blurOnWindowBlur: requireElement<HTMLInputElement>('blurOnWindowBlur'),
  blurOnIdle: requireElement<HTMLInputElement>('blurOnIdle'),
  idleSeconds: requireElement<HTMLInputElement>('idleSeconds'),
  debug: requireElement<HTMLInputElement>('debug'),
  targets: requireElement<HTMLDivElement>('targets'),
  customSelectors: requireElement<HTMLDivElement>('customSelectors'),
  status: requireElement<HTMLParagraphElement>('status'),
  version: requireElement<HTMLSpanElement>('version'),
  exportButton: requireElement<HTMLButtonElement>('export'),
  importButton: requireElement<HTMLButtonElement>('import'),
  importFile: requireElement<HTMLInputElement>('importFile'),
  resetButton: requireElement<HTMLButtonElement>('reset'),
};

const targetInputs = new Map<TargetId, HTMLInputElement>();
const selectorInputs = new Map<TargetId, HTMLTextAreaElement>();

let hydrating = false;
let statusTimer: ReturnType<typeof setTimeout> | null = null;

const setStatus = (message: string): void => {
  el.status.textContent = message;
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    el.status.textContent = '';
  }, 4000);
};

const collectTargets = (): Record<TargetId, boolean> => {
  const targets = {} as Record<TargetId, boolean>;
  for (const [id, input] of targetInputs) targets[id] = input.checked;
  return targets;
};

const collectCustomSelectors = (): Partial<Record<TargetId, string[]>> => {
  const result: Partial<Record<TargetId, string[]>> = {};
  for (const [id, textarea] of selectorInputs) {
    const lines = textarea.value
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const rejected = lines.filter((line) => !isSafeSelector(line));
    if (rejected.length > 0) {
      setStatus(
        t('status_selectorRejected', 'Some selectors were rejected: ') + rejected.join(', '),
      );
    }
    const accepted = lines.filter(isSafeSelector);
    if (accepted.length > 0) result[id] = accepted;
  }
  return result;
};

const buildTargetRows = (): void => {
  for (const definition of TARGET_DEFINITIONS) {
    const { row, input } = createSwitchRow(
      `target-${definition.id}`,
      t(definition.labelKey, definition.id),
    );
    input.addEventListener('change', () => {
      if (!hydrating) void patchSettings({ targets: collectTargets() });
    });
    targetInputs.set(definition.id, input);
    el.targets.append(row);

    const label = document.createElement('label');
    const caption = document.createElement('span');
    caption.textContent = t(definition.labelKey, definition.id);
    const textarea = document.createElement('textarea');
    textarea.id = `selectors-${definition.id}`;
    textarea.spellcheck = false;
    textarea.placeholder = '[data-sentry-component="Example"] span';
    textarea.addEventListener('change', () => {
      if (!hydrating) void patchSettings({ customSelectors: collectCustomSelectors() });
    });
    label.append(caption, textarea);
    selectorInputs.set(definition.id, textarea);
    el.customSelectors.append(label);
  }
};

const hydrate = (settings: Settings): void => {
  hydrating = true;
  el.enabled.checked = settings.enabled;
  el.blurRadius.value = String(settings.blurRadius);
  el.blurRadiusValue.value = `${settings.blurRadius}px`;
  el.animate.checked = settings.animate;
  el.revealOnHover.checked = settings.revealOnHover;
  el.revealDelayMs.value = String(settings.revealDelayMs);
  el.holdKeyReveal.checked = settings.holdKeyReveal;
  el.holdKey.value = settings.holdKey;
  el.blurOnWindowBlur.checked = settings.blurOnWindowBlur;
  el.blurOnIdle.checked = settings.blurOnIdle;
  el.idleSeconds.value = String(settings.idleSeconds);
  el.debug.checked = settings.debug;

  for (const [id, input] of targetInputs) input.checked = settings.targets[id] ?? false;
  for (const [id, textarea] of selectorInputs) {
    textarea.value = (settings.customSelectors[id] ?? []).join('\n');
  }
  hydrating = false;
};

const bindToggle = (input: HTMLInputElement, key: keyof Settings): void => {
  input.addEventListener('change', () => {
    if (!hydrating) void patchSettings({ [key]: input.checked } as Partial<Settings>);
  });
};

const bindNumber = (input: HTMLInputElement, key: keyof Settings): void => {
  input.addEventListener('change', () => {
    if (!hydrating) void patchSettings({ [key]: Number(input.value) } as Partial<Settings>);
  });
};

const bind = (): void => {
  bindToggle(el.enabled, 'enabled');
  bindToggle(el.animate, 'animate');
  bindToggle(el.revealOnHover, 'revealOnHover');
  bindToggle(el.holdKeyReveal, 'holdKeyReveal');
  bindToggle(el.blurOnWindowBlur, 'blurOnWindowBlur');
  bindToggle(el.blurOnIdle, 'blurOnIdle');
  bindToggle(el.debug, 'debug');
  bindNumber(el.revealDelayMs, 'revealDelayMs');
  bindNumber(el.idleSeconds, 'idleSeconds');

  el.blurRadius.addEventListener('input', () => {
    el.blurRadiusValue.value = `${el.blurRadius.value}px`;
  });
  el.blurRadius.addEventListener('change', () => {
    if (!hydrating) void patchSettings({ blurRadius: Number(el.blurRadius.value) });
  });

  el.holdKey.addEventListener('change', () => {
    if (!hydrating) void patchSettings({ holdKey: el.holdKey.value as HoldKey });
  });

  el.exportButton.addEventListener('click', () => {
    void (async () => {
      const settings = await loadSettings();
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'bale-privacy-settings.json';
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus(t('status_exported', 'Settings exported.'));
    })();
  });

  el.importButton.addEventListener('click', () => el.importFile.click());

  el.importFile.addEventListener('change', () => {
    const file = el.importFile.files?.[0];
    if (!file) return;
    void (async () => {
      try {
        // Everything imported is re-validated, so a hand-edited or corrupted
        // file can only ever produce safe, in-range settings.
        const settings = migrateSettings(JSON.parse(await file.text()));
        await saveSettings(settings);
        hydrate(settings);
        setStatus(t('status_imported', 'Settings imported.'));
      } catch {
        setStatus(t('status_importFailed', 'That file could not be read.'));
      } finally {
        el.importFile.value = '';
      }
    })();
  });

  el.resetButton.addEventListener('click', () => {
    void (async () => {
      hydrate(await resetSettings());
      setStatus(t('status_reset', 'Settings reset to defaults.'));
    })();
  });
};

const main = async (): Promise<void> => {
  localizeDocument();
  buildTargetRows();
  bind();
  hydrate(await loadSettings());
  onSettingsChanged(hydrate);
  el.version.textContent = `v${ext.runtime.getManifest().version}`;
};

void main();
