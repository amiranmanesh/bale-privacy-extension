import type { Settings } from '../../common/types.js';
import { selectorsForTarget } from './cssBuilder.js';
import { TARGET_DEFINITIONS } from './selectors.js';

export interface SelectorReport {
  target: string;
  selector: string;
  matches: number;
}

/**
 * Counts how many nodes each selector currently matches.
 *
 * Bale ships a new bundle regularly; this is the fastest way to notice that an
 * anchor has been renamed. It only runs when the user turns on debug mode.
 */
export const collectSelectorReport = (
  settings: Settings,
  root: ParentNode = document,
): SelectorReport[] => {
  const report: SelectorReport[] = [];
  for (const definition of TARGET_DEFINITIONS) {
    for (const selector of selectorsForTarget(definition, settings.customSelectors)) {
      let matches: number;
      try {
        matches = root.querySelectorAll(selector).length;
      } catch {
        matches = -1; // invalid selector, e.g. a custom one the user mistyped
      }
      report.push({ target: definition.id, selector, matches });
    }
  }
  return report;
};

/** Prints a grouped summary of {@link collectSelectorReport} to the page console. */
export const logSelectorReport = (settings: Settings): void => {
  const report = collectSelectorReport(settings);
  const dead = report.filter((entry) => entry.matches === 0);
  const broken = report.filter((entry) => entry.matches < 0);

  /* eslint-disable no-console */
  console.groupCollapsed(
    `[bale-privacy] selectors: ${report.length - dead.length - broken.length}/${report.length} matching`,
  );
  console.table(report);
  if (dead.length > 0) console.info('[bale-privacy] selectors matching nothing', dead);
  if (broken.length > 0) console.warn('[bale-privacy] invalid selectors', broken);
  console.groupEnd();
  /* eslint-enable no-console */
};
