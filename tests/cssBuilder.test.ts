import { describe, expect, it } from 'vitest';
import { CSS_VARS, STATE_ATTRIBUTE } from '../src/common/constants.js';
import { DEFAULT_SETTINGS } from '../src/common/settings.js';
import type { Settings, TargetDefinition } from '../src/common/types.js';
import {
  DEFAULT_RUNTIME_STATE,
  buildStylesheet,
  computeCssVars,
  computeStateTokens,
  selectorsForTarget,
} from '../src/content/engine/cssBuilder.js';
import { TARGET_DEFINITIONS } from '../src/content/engine/selectors.js';

const definition: TargetDefinition = {
  id: 'messageText',
  labelKey: 'target_messageText',
  kind: 'text',
  selectors: ['.bubble'],
};

const settings = (patch: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, ...patch });

describe('selectorsForTarget', () => {
  it('appends custom selectors without duplicating built-ins', () => {
    const result = selectorsForTarget(definition, { messageText: ['.bubble', '.extra'] });
    expect(result).toEqual(['.bubble', '.extra']);
  });

  it('silently drops custom selectors that would break out of the rule', () => {
    const result = selectorsForTarget(definition, { messageText: ['.x { }'] });
    expect(result).toEqual(['.bubble']);
  });
});

describe('buildStylesheet', () => {
  const css = buildStylesheet({}, [definition]);

  it('gates every rule on the active token and the target token', () => {
    expect(css).toContain(`html[${STATE_ATTRIBUTE}~="active"][${STATE_ATTRIBUTE}~="messageText"] .bubble`);
  });

  it('blurs with the text radius for a text target', () => {
    expect(css).toContain(`filter: blur(var(${CSS_VARS.textRadius})) !important;`);
  });

  it('uses the stronger graphic radius for a graphic target', () => {
    const graphic = buildStylesheet({}, [{ ...definition, kind: 'graphic' }]);
    expect(graphic).toContain(`filter: blur(var(${CSS_VARS.radius})) !important;`);
  });

  it('emits hover and peek reveal rules after the blur rule', () => {
    expect(css.indexOf(':hover')).toBeGreaterThan(css.indexOf('filter: blur'));
    expect(css.indexOf(`html[${STATE_ATTRIBUTE}~="peek"]`)).toBeGreaterThan(css.indexOf(':hover'));
  });

  it('covers every registered target in the real registry', () => {
    const full = buildStylesheet();
    for (const target of TARGET_DEFINITIONS) {
      expect(full).toContain(`[${STATE_ATTRIBUTE}~="${target.id}"]`);
    }
  });
});

describe('computeStateTokens', () => {
  it('is empty when the extension is off', () => {
    expect(computeStateTokens(settings({ enabled: false }), DEFAULT_RUNTIME_STATE)).toEqual([]);
  });

  it('lists the active token plus every enabled target', () => {
    const tokens = computeStateTokens(
      settings({ targets: { ...DEFAULT_SETTINGS.targets, composer: true } }),
      DEFAULT_RUNTIME_STATE,
    );
    expect(tokens).toContain('active');
    expect(tokens).toContain('composer');
  });

  it('omits a target that is switched off', () => {
    const tokens = computeStateTokens(
      settings({ targets: { ...DEFAULT_SETTINGS.targets, messageMedia: false } }),
      DEFAULT_RUNTIME_STATE,
    );
    expect(tokens).not.toContain('messageMedia');
  });

  it('turns blurring on when the window loses focus, even if the master switch is off', () => {
    const tokens = computeStateTokens(settings({ enabled: false, blurOnWindowBlur: true }), {
      ...DEFAULT_RUNTIME_STATE,
      windowFocused: false,
    });
    expect(tokens).toContain('active');
  });

  it('suppresses hover and peek while blur is forced', () => {
    const tokens = computeStateTokens(
      settings({ blurOnIdle: true, holdKeyReveal: true }),
      { ...DEFAULT_RUNTIME_STATE, idle: true, peeking: true },
    );
    expect(tokens).not.toContain('hover');
    expect(tokens).not.toContain('peek');
  });

  it('only peeks when the feature is enabled and the key is held', () => {
    expect(
      computeStateTokens(settings({ holdKeyReveal: true }), {
        ...DEFAULT_RUNTIME_STATE,
        peeking: true,
      }),
    ).toContain('peek');
    expect(
      computeStateTokens(settings({ holdKeyReveal: false }), {
        ...DEFAULT_RUNTIME_STATE,
        peeking: true,
      }),
    ).not.toContain('peek');
  });
});

describe('computeCssVars', () => {
  it('scales the graphic radius above the text radius', () => {
    const vars = computeCssVars(settings({ blurRadius: 8 }));
    expect(vars[CSS_VARS.textRadius]).toBe('8px');
    expect(vars[CSS_VARS.radius]).toBe('14px');
  });

  it('collapses the transition when animation is off', () => {
    expect(computeCssVars(settings({ animate: false }))[CSS_VARS.transition]).toBe('0ms');
  });
});
