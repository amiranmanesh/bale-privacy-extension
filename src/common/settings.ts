import { HOLD_KEYS, TARGET_IDS } from './types.js';
import type { HoldKey, Settings, TargetId } from './types.js';

export const SCHEMA_VERSION = 1;

export const LIMITS = {
  blurRadius: { min: 1, max: 24 },
  revealDelayMs: { min: 0, max: 2000 },
  idleSeconds: { min: 5, max: 3600 },
  customSelectorsPerTarget: 20,
  customSelectorLength: 200,
} as const;

export const DEFAULT_SETTINGS: Settings = {
  schemaVersion: SCHEMA_VERSION,
  enabled: true,
  targets: {
    sidebarText: true,
    sidebarAvatars: true,
    headerPeer: true,
    messageText: true,
    messageMedia: true,
    messageAvatars: true,
    composer: false,
    profileMedia: true,
  },
  blurRadius: 6,
  revealOnHover: true,
  revealDelayMs: 0,
  holdKeyReveal: false,
  holdKey: 'Alt',
  blurOnWindowBlur: false,
  blurOnIdle: false,
  idleSeconds: 60,
  animate: true,
  customSelectors: {},
  debug: false,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const asBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const asNumber = (value: unknown, fallback: number, min: number, max: number): number =>
  typeof value === 'number' && Number.isFinite(value)
    ? clamp(Math.round(value), min, max)
    : fallback;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * A custom selector is user input that ends up inside a generated stylesheet.
 *
 * Braces, semicolons, at-rules and comment markers could terminate the rule and
 * smuggle in extra CSS. Commas are rejected too: every custom selector is
 * prefixed with the extension's state gate, and a comma would let the second
 * half escape that prefix and apply to the whole page.
 */
export const isSafeSelector = (selector: string): boolean => {
  if (selector.length === 0 || selector.length > LIMITS.customSelectorLength) return false;
  if (/[{}<;@,\\]/.test(selector)) return false;
  if (selector.includes('/*') || selector.includes('*/')) return false;
  return true;
};

const sanitizeCustomSelectors = (value: unknown): Partial<Record<TargetId, string[]>> => {
  if (!isRecord(value)) return {};
  const result: Partial<Record<TargetId, string[]>> = {};
  for (const id of TARGET_IDS) {
    const raw = value[id];
    if (!Array.isArray(raw)) continue;
    const cleaned = raw
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(isSafeSelector)
      .slice(0, LIMITS.customSelectorsPerTarget);
    if (cleaned.length > 0) result[id] = cleaned;
  }
  return result;
};

/**
 * Turns an arbitrary stored value into a complete, in-range {@link Settings}.
 * Unknown keys are dropped and missing ones fall back to defaults, so a
 * corrupted or downgraded profile can never break the content script.
 */
export const sanitizeSettings = (raw: unknown): Settings => {
  const input = isRecord(raw) ? raw : {};
  const targetsInput = isRecord(input.targets) ? input.targets : {};
  const targets = {} as Record<TargetId, boolean>;
  for (const id of TARGET_IDS) {
    targets[id] = asBoolean(targetsInput[id], DEFAULT_SETTINGS.targets[id]);
  }

  const holdKey = HOLD_KEYS.includes(input.holdKey as HoldKey)
    ? (input.holdKey as HoldKey)
    : DEFAULT_SETTINGS.holdKey;

  return {
    schemaVersion: SCHEMA_VERSION,
    enabled: asBoolean(input.enabled, DEFAULT_SETTINGS.enabled),
    targets,
    blurRadius: asNumber(
      input.blurRadius,
      DEFAULT_SETTINGS.blurRadius,
      LIMITS.blurRadius.min,
      LIMITS.blurRadius.max,
    ),
    revealOnHover: asBoolean(input.revealOnHover, DEFAULT_SETTINGS.revealOnHover),
    revealDelayMs: asNumber(
      input.revealDelayMs,
      DEFAULT_SETTINGS.revealDelayMs,
      LIMITS.revealDelayMs.min,
      LIMITS.revealDelayMs.max,
    ),
    holdKeyReveal: asBoolean(input.holdKeyReveal, DEFAULT_SETTINGS.holdKeyReveal),
    holdKey,
    blurOnWindowBlur: asBoolean(input.blurOnWindowBlur, DEFAULT_SETTINGS.blurOnWindowBlur),
    blurOnIdle: asBoolean(input.blurOnIdle, DEFAULT_SETTINGS.blurOnIdle),
    idleSeconds: asNumber(
      input.idleSeconds,
      DEFAULT_SETTINGS.idleSeconds,
      LIMITS.idleSeconds.min,
      LIMITS.idleSeconds.max,
    ),
    animate: asBoolean(input.animate, DEFAULT_SETTINGS.animate),
    customSelectors: sanitizeCustomSelectors(input.customSelectors),
    debug: asBoolean(input.debug, DEFAULT_SETTINGS.debug),
  };
};

/**
 * Upgrades a stored payload to the current schema. Every step is additive; the
 * final {@link sanitizeSettings} pass fills in anything a step did not set.
 */
export const migrateSettings = (raw: unknown): Settings => {
  const input = isRecord(raw) ? { ...raw } : {};
  const stored = typeof input.schemaVersion === 'number' ? input.schemaVersion : 0;

  // v0 -> v1: the pre-release build stored a flat `blur` boolean.
  if (stored < 1 && typeof input.blur === 'boolean') {
    input.enabled = input.blur;
    delete input.blur;
  }

  return sanitizeSettings(input);
};
