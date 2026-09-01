import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  LIMITS,
  SCHEMA_VERSION,
  isSafeSelector,
  migrateSettings,
  sanitizeSettings,
} from '../src/common/settings.js';
import { TARGET_IDS } from '../src/common/types.js';

describe('sanitizeSettings', () => {
  it('returns the defaults for anything that is not an object', () => {
    for (const input of [undefined, null, 42, 'nope', []]) {
      expect(sanitizeSettings(input)).toEqual(DEFAULT_SETTINGS);
    }
  });

  it('keeps every known target and drops unknown ones', () => {
    const result = sanitizeSettings({ targets: { messageText: false, bogusTarget: true } });
    expect(Object.keys(result.targets).sort()).toEqual([...TARGET_IDS].sort());
    expect(result.targets.messageText).toBe(false);
    expect(result.targets.sidebarText).toBe(DEFAULT_SETTINGS.targets.sidebarText);
  });

  it('clamps numbers into their allowed range', () => {
    expect(sanitizeSettings({ blurRadius: 9999 }).blurRadius).toBe(LIMITS.blurRadius.max);
    expect(sanitizeSettings({ blurRadius: -5 }).blurRadius).toBe(LIMITS.blurRadius.min);
    expect(sanitizeSettings({ idleSeconds: 1 }).idleSeconds).toBe(LIMITS.idleSeconds.min);
    expect(sanitizeSettings({ revealDelayMs: 12.7 }).revealDelayMs).toBe(13);
  });

  it('falls back to the default hold key for an unknown value', () => {
    expect(sanitizeSettings({ holdKey: 'Meta' }).holdKey).toBe(DEFAULT_SETTINGS.holdKey);
    expect(sanitizeSettings({ holdKey: 'Shift' }).holdKey).toBe('Shift');
  });

  it('always stamps the current schema version', () => {
    expect(sanitizeSettings({ schemaVersion: 99 }).schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('filters unsafe custom selectors and caps the list length', () => {
    const result = sanitizeSettings({
      customSelectors: {
        messageText: ['.ok', 'div { color: red }', '  .trimmed  ', 42],
        nope: ['.ignored'],
      },
    });
    expect(result.customSelectors.messageText).toEqual(['.ok', '.trimmed']);
    expect(Object.keys(result.customSelectors)).toEqual(['messageText']);
  });

  it('drops a custom selector list once it exceeds the per-target cap', () => {
    const many = Array.from({ length: LIMITS.customSelectorsPerTarget + 5 }, (_, i) => `.c${i}`);
    const result = sanitizeSettings({ customSelectors: { messageText: many } });
    expect(result.customSelectors.messageText).toHaveLength(LIMITS.customSelectorsPerTarget);
  });
});

describe('isSafeSelector', () => {
  it.each(['.a', '[data-sentry-component="X"] span', 'div > p:not(:has(*))'])(
    'accepts %s',
    (selector) => expect(isSafeSelector(selector)).toBe(true),
  );

  it.each([
    '',
    'div { color: red }',
    'a } @import url(evil)',
    '.a /* comment */',
    '.scoped, *',
    'x'.repeat(LIMITS.customSelectorLength + 1),
  ])('rejects %s', (selector) => expect(isSafeSelector(selector)).toBe(false));
});

describe('migrateSettings', () => {
  it('upgrades the pre-release flat `blur` flag', () => {
    const result = migrateSettings({ blur: false });
    expect(result.enabled).toBe(false);
    expect(result).not.toHaveProperty('blur');
  });

  it('renames the v1 profileMedia target to profilePanel', () => {
    const result = migrateSettings({
      schemaVersion: 1,
      targets: { ...DEFAULT_SETTINGS.targets, profileMedia: false },
    });
    expect(result.targets.profilePanel).toBe(false);
    expect(result.targets).not.toHaveProperty('profileMedia');
  });

  it('leaves a current-schema payload untouched apart from validation', () => {
    const stored = { ...DEFAULT_SETTINGS, blurRadius: 12 };
    expect(migrateSettings(stored)).toEqual({ ...DEFAULT_SETTINGS, blurRadius: 12 });
  });
});
