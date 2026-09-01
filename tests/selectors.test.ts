// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { TARGET_IDS } from '../src/common/types.js';
import { TARGET_DEFINITIONS, getTargetDefinition } from '../src/content/engine/selectors.js';
import { buildStylesheet } from '../src/content/engine/cssBuilder.js';

describe('target registry', () => {
  it('defines exactly one entry per target id', () => {
    expect(TARGET_DEFINITIONS.map((d) => d.id).sort()).toEqual([...TARGET_IDS].sort());
  });

  it('gives every target at least one selector and a label key', () => {
    for (const definition of TARGET_DEFINITIONS) {
      expect(definition.selectors.length).toBeGreaterThan(0);
      expect(definition.labelKey).toBe(`target_${definition.id}`);
    }
  });

  it('contains no duplicate selectors inside a target', () => {
    for (const definition of TARGET_DEFINITIONS) {
      expect(new Set(definition.selectors).size).toBe(definition.selectors.length);
    }
  });

  it('only ships selectors the browser can actually parse', () => {
    for (const definition of TARGET_DEFINITIONS) {
      for (const selector of [...definition.selectors, ...(definition.mediaSelectors ?? [])]) {
        expect(() => document.querySelector(selector), selector).not.toThrow();
      }
    }
  });

  it('resolves definitions by id', () => {
    expect(getTargetDefinition('messageText')?.kind).toBe('text');
    expect(getTargetDefinition('nope')).toBeUndefined();
  });
});

describe('generated stylesheet', () => {
  it('parses as CSS and produces one rule set per emitted block', () => {
    const style = document.createElement('style');
    style.textContent = buildStylesheet();
    document.head.append(style);

    const sheet = style.sheet;
    expect(sheet).not.toBeNull();
    // Four blocks (blur, transition, hover reveal, peek reveal) per group of
    // selectors, and a target with picture-only selectors contributes two groups.
    const groups = TARGET_DEFINITIONS.reduce(
      (total, target) => total + 1 + (target.mediaSelectors?.length ? 1 : 0),
      0,
    );
    expect(sheet?.cssRules.length).toBe(groups * 4);
  });
});
