import { STATE_TOKENS } from '../common/constants.js';
import { loadSettings, onSettingsChanged } from '../common/storage.js';
import { DEFAULT_SETTINGS } from '../common/settings.js';
import type { Settings } from '../common/types.js';
import { ActivityWatcher } from './engine/activityWatcher.js';
import { buildStylesheet, computeCssVars, computeStateTokens } from './engine/cssBuilder.js';
import { logSelectorReport } from './engine/diagnostics.js';
import { StyleController } from './engine/styleController.js';
import { TooltipGuard } from './engine/tooltipGuard.js';

/**
 * Content script entry point.
 *
 * The whole feature is CSS: we inject one stylesheet whose rules are gated on
 * state tokens, then keep those tokens in sync with the settings and with live
 * window state. There is no per-element JavaScript and no MutationObserver over
 * the message list, so an open Bale tab costs nothing while idle and newly
 * rendered messages are blurred by the style engine the moment they paint.
 */

const controller = new StyleController();
const tooltipGuard = new TooltipGuard();

let settings: Settings = DEFAULT_SETTINGS;
let stylesheetSignature = '';

const watcher = new ActivityWatcher(
  {
    idleSeconds: 0,
    holdKey: DEFAULT_SETTINGS.holdKey,
    holdKeyEnabled: DEFAULT_SETTINGS.holdKeyReveal,
  },
  () => render(),
);

function render(): void {
  const tokens = computeStateTokens(settings, watcher.getState());
  controller.setTokens(tokens);
  // Native tooltips are only a leak while something is blurred and hovering
  // does not already reveal it.
  tooltipGuard.setEnabled(
    tokens.includes(STATE_TOKENS.active) && !tokens.includes(STATE_TOKENS.hover),
  );
}

function apply(next: Settings): void {
  settings = next;

  // The stylesheet only depends on the custom selectors; everything else is
  // expressed with tokens and custom properties, so avoid a needless reparse.
  const signature = JSON.stringify(next.customSelectors);
  if (signature !== stylesheetSignature) {
    stylesheetSignature = signature;
    controller.setStylesheet(buildStylesheet(next.customSelectors));
  }

  controller.setVars(computeCssVars(next));
  watcher.update({
    idleSeconds: next.blurOnIdle ? next.idleSeconds : 0,
    holdKey: next.holdKey,
    holdKeyEnabled: next.holdKeyReveal,
  });
  render();

  if (next.debug) {
    // Give the app a moment to paint before counting matches.
    setTimeout(() => logSelectorReport(next), 1500);
  }
}

async function main(): Promise<void> {
  watcher.start();
  apply(await loadSettings());
  onSettingsChanged(apply);
}

void main();
