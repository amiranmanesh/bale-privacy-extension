import { CSS_VARS, STATE_ATTRIBUTE, STATE_TOKENS } from '../../common/constants.js';
import { isSafeSelector } from '../../common/settings.js';
import type { Settings, TargetDefinition, TargetId } from '../../common/types.js';
import { TARGET_DEFINITIONS } from './selectors.js';

/**
 * The generated stylesheet is *static*: it contains a rule for every target,
 * gated on a state token in the `data-bale-privacy` attribute of <html>.
 *
 * Toggling a target, hovering, peeking or changing the blur radius therefore
 * never rebuilds CSS — it only rewrites one attribute or one custom property,
 * which is a single cheap style recalculation instead of a full reparse.
 */

const attr = (token: string): string => `[${STATE_ATTRIBUTE}~="${token}"]`;

const ACTIVE = `html${attr(STATE_TOKENS.active)}`;

/** Merges built-in selectors with the user's own, de-duplicated and validated. */
export const selectorsForTarget = (
  definition: TargetDefinition,
  custom: Partial<Record<TargetId, string[]>> = {},
): string[] => {
  const extra = (custom[definition.id] ?? []).filter(isSafeSelector);
  return [...new Set([...definition.selectors, ...extra])];
};

/** Media selectors get the stronger graphic blur regardless of the target kind. */
export const mediaSelectorsForTarget = (definition: TargetDefinition): string[] => [
  ...new Set(definition.mediaSelectors ?? []),
];

const blurVar = (kind: TargetDefinition['kind']): string =>
  kind === 'graphic' ? CSS_VARS.radius : CSS_VARS.textRadius;

const rule = (selectors: string[], body: string): string =>
  selectors.length === 0 ? '' : `${selectors.join(',\n')} {\n${body}\n}\n`;

/**
 * Emits the four blocks that make one group of selectors blur, fade, reveal on
 * hover and reveal on peek, all gated on the target's state token.
 */
const blocksFor = (
  targetId: TargetId,
  selectors: string[],
  kind: TargetDefinition['kind'],
): string[] => {
  if (selectors.length === 0) return [];
  const gate = `${ACTIVE}${attr(targetId)} `;

  return [
    rule(
      selectors.map((selector) => `${gate}${selector}`),
      [
        `  filter: blur(var(${blurVar(kind)})) !important;`,
        '  -webkit-user-select: none !important;',
        '  user-select: none !important;',
      ].join('\n'),
    ),

    // Smooth fade, opt-in so that "instant" stays truly instant.
    rule(
      selectors.map(
        (selector) => `${ACTIVE}${attr(STATE_TOKENS.animate)}${attr(targetId)} ${selector}`,
      ),
      `  transition: filter var(${CSS_VARS.transition}) ease !important;`,
    ),

    // Hover reveal for a single element.
    rule(
      selectors.map(
        (selector) => `${ACTIVE}${attr(STATE_TOKENS.hover)}${attr(targetId)} ${selector}:hover`,
      ),
      [
        '  filter: none !important;',
        '  -webkit-user-select: auto !important;',
        '  user-select: auto !important;',
        `  transition-delay: var(${CSS_VARS.revealDelay}) !important;`,
      ].join('\n'),
    ),

    // Hold-to-peek reveals everything at once; it must win over the rules above.
    rule(
      selectors.map((selector) => `html${attr(STATE_TOKENS.peek)} ${selector}`),
      [
        '  filter: none !important;',
        '  -webkit-user-select: auto !important;',
        '  user-select: auto !important;',
        '  transition-delay: 0ms !important;',
      ].join('\n'),
    ),
  ];
};

/**
 * Builds the complete stylesheet.
 *
 * @param customSelectors user supplied selectors, keyed by target
 * @param definitions injectable for tests
 */
export const buildStylesheet = (
  customSelectors: Partial<Record<TargetId, string[]>> = {},
  definitions: TargetDefinition[] = TARGET_DEFINITIONS,
): string => {
  const chunks: string[] = [
    '/* Injected by the Bale Privacy extension. Removing it restores the page. */',
  ];

  for (const definition of definitions) {
    chunks.push(
      ...blocksFor(definition.id, selectorsForTarget(definition, customSelectors), definition.kind),
      ...blocksFor(definition.id, mediaSelectorsForTarget(definition), 'graphic'),
    );
  }

  return chunks.filter(Boolean).join('\n');
};

export interface RuntimeState {
  /** The browser window currently has focus. */
  windowFocused: boolean;
  /** No pointer/keyboard activity for longer than the configured timeout. */
  idle: boolean;
  /** The hold-to-reveal key is down right now. */
  peeking: boolean;
}

export const DEFAULT_RUNTIME_STATE: RuntimeState = {
  windowFocused: true,
  idle: false,
  peeking: false,
};

/**
 * Derives the `data-bale-privacy` token list from settings plus live state.
 *
 * "Forced" blur (window unfocused / user idle) deliberately overrides both the
 * master switch and any reveal: the point of those options is that walking away
 * from the screen always hides everything.
 */
export const computeStateTokens = (settings: Settings, state: RuntimeState): string[] => {
  const forced =
    (settings.blurOnWindowBlur && !state.windowFocused) || (settings.blurOnIdle && state.idle);

  const active = settings.enabled || forced;
  if (!active) return [];

  const tokens: string[] = [STATE_TOKENS.active];
  if (settings.animate) tokens.push(STATE_TOKENS.animate);
  if (settings.revealOnHover && !forced) tokens.push(STATE_TOKENS.hover);
  if (settings.holdKeyReveal && state.peeking && !forced) tokens.push(STATE_TOKENS.peek);

  for (const [id, on] of Object.entries(settings.targets)) {
    if (on) tokens.push(id);
  }

  return tokens;
};

/** CSS custom properties that carry the numeric parts of the settings. */
export const computeCssVars = (settings: Settings): Record<string, string> => ({
  [CSS_VARS.textRadius]: `${settings.blurRadius}px`,
  // Pictures need a stronger blur than text before they stop being readable.
  [CSS_VARS.radius]: `${Math.round(settings.blurRadius * 1.75)}px`,
  [CSS_VARS.transition]: settings.animate ? '160ms' : '0ms',
  [CSS_VARS.revealDelay]: `${settings.revealDelayMs}ms`,
});
