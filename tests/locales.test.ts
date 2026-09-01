import { describe, expect, it } from 'vitest';
import en from '../public/_locales/en/messages.json';
import fa from '../public/_locales/fa/messages.json';
import { TARGET_IDS } from '../src/common/types.js';

/**
 * Store limits, enforced here rather than discovered at submission time: the
 * Chrome Web Store truncates or rejects a name over 45 characters and a
 * description over 132. The Persian description was 147 when this test was
 * written.
 */
const LIMITS = { extension_name: 45, extension_description: 132 };

const LOCALES = ['en', 'fa'] as const;

type Messages = Record<string, { message: string; description?: string }>;

const messages: Record<(typeof LOCALES)[number], Messages> = { en, fa };

describe.each(LOCALES)('%s locale', (locale) => {
  const bundle = messages[locale];

  it('defines the same keys as English', () => {
    expect(Object.keys(bundle).sort()).toEqual(Object.keys(messages.en).sort());
  });

  it('has a label for every blur target', () => {
    for (const id of TARGET_IDS) {
      expect(bundle, id).toHaveProperty(`target_${id}`);
    }
  });

  it('has no empty strings', () => {
    for (const [key, entry] of Object.entries(bundle)) {
      expect(entry.message.trim(), key).not.toBe('');
    }
  });

  it.each(Object.entries(LIMITS))('keeps %s within the store limit', (key, limit) => {
    const entry = bundle[key];
    expect(entry, key).toBeDefined();
    expect(
      entry?.message.length,
      `${key} is ${entry?.message.length} characters`,
    ).toBeLessThanOrEqual(limit);
  });
});
