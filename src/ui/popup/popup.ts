import { ext, t } from '../../common/browser.js';
import { loadSettings, onSettingsChanged, patchSettings } from '../../common/storage.js';
import type { Settings, TargetId } from '../../common/types.js';
import { TARGET_DEFINITIONS } from '../../content/engine/selectors.js';
import { createSwitchRow, localizeDocument, requireElement } from '../dom.js';

/**
 * The popup is a thin view over the settings object. It never talks to a tab:
 * it writes to storage and the content scripts react, which keeps every open
 * Bale tab in sync — including background ones — without a tabs permission.
 */

const enabled = requireElement<HTMLInputElement>('enabled');
const revealOnHover = requireElement<HTMLInputElement>('revealOnHover');
const blurRadius = requireElement<HTMLInputElement>('blurRadius');
const blurRadiusValue = requireElement<HTMLOutputElement>('blurRadiusValue');
const targetsContainer = requireElement<HTMLDivElement>('targets');
const shortcutHint = requireElement<HTMLSpanElement>('shortcut-hint');
const openOptions = requireElement<HTMLButtonElement>('openOptions');

const targetInputs = new Map<TargetId, HTMLInputElement>();

/** Guards against feedback loops while we programmatically set control values. */
let hydrating = false;

const buildTargetRows = (): void => {
  for (const definition of TARGET_DEFINITIONS) {
    const { row, input } = createSwitchRow(
      `target-${definition.id}`,
      t(definition.labelKey, definition.id),
    );
    input.addEventListener('change', () => {
      if (hydrating) return;
      void patchSettings({
        targets: { ...currentTargets(), [definition.id]: input.checked },
      });
    });
    targetInputs.set(definition.id, input);
    targetsContainer.append(row);
  }
};

const currentTargets = (): Record<TargetId, boolean> => {
  const targets = {} as Record<TargetId, boolean>;
  for (const [id, input] of targetInputs) targets[id] = input.checked;
  return targets;
};

const hydrate = (settings: Settings): void => {
  hydrating = true;
  enabled.checked = settings.enabled;
  revealOnHover.checked = settings.revealOnHover;
  blurRadius.value = String(settings.blurRadius);
  blurRadiusValue.value = `${settings.blurRadius}px`;
  for (const [id, input] of targetInputs) input.checked = settings.targets[id] ?? false;
  hydrating = false;
};

const bind = (): void => {
  enabled.addEventListener('change', () => {
    if (!hydrating) void patchSettings({ enabled: enabled.checked });
  });

  revealOnHover.addEventListener('change', () => {
    if (!hydrating) void patchSettings({ revealOnHover: revealOnHover.checked });
  });

  // `input` fires on every pixel of drag: reflect it locally at once, persist
  // once the value settles so we do not hammer storage.sync quotas.
  blurRadius.addEventListener('input', () => {
    blurRadiusValue.value = `${blurRadius.value}px`;
  });
  blurRadius.addEventListener('change', () => {
    if (!hydrating) void patchSettings({ blurRadius: Number(blurRadius.value) });
  });

  openOptions.addEventListener('click', () => {
    void ext.runtime.openOptionsPage?.();
    window.close();
  });
};

const main = async (): Promise<void> => {
  localizeDocument();
  shortcutHint.textContent = t('popup_shortcutHint', 'Alt+Shift+B');
  buildTargetRows();
  bind();
  hydrate(await loadSettings());
  onSettingsChanged(hydrate);
};

void main();
