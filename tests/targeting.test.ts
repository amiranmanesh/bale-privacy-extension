// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../src/common/settings.js';
import { collectSelectorReport } from '../src/content/engine/diagnostics.js';
import { selectorsForTarget } from '../src/content/engine/cssBuilder.js';
import { getTargetDefinition } from '../src/content/engine/selectors.js';

/**
 * A miniature stand-in for the parts of Bale Web the registry targets, built
 * from the attributes observed in the shipped bundle. It lets the leaf strategy
 * be tested for what it actually has to get right: text elements yes, layout
 * containers and media no.
 */
const FIXTURE = `
  <div data-sentry-element="DialogItem" data-sentry-source-file="DialogItemWrapper.tsx">
    <div class="_avatar"><img id="row-avatar" src="a.png" alt="" /></div>
    <div class="_body">
      <div class="_top"><span id="row-name" dir="auto">Maryam</span><span id="row-time">12:04</span></div>
      <div class="_bottom"><span id="row-preview" dir="auto">see you tomorrow</span></div>
    </div>
  </div>
  <div data-sentry-component="MessagesListFC">
    <div class="_message-item">
      <div data-sentry-component="MessageContent">
        <span id="msg-text">the pin is 4417</span>
        <div class="_empty"></div>
      </div>
      <img id="msg-photo" src="photo.jpg" alt="" />
    </div>
  </div>
`;

const matches = (targetId: string): string[] => {
  const definition = getTargetDefinition(targetId);
  if (!definition) throw new Error(`no definition for ${targetId}`);
  const found = new Set<string>();
  for (const selector of selectorsForTarget(definition)) {
    for (const element of document.querySelectorAll(selector)) {
      if (element.id) found.add(element.id);
    }
  }
  return [...found].sort();
};

beforeEach(() => {
  document.body.innerHTML = FIXTURE;
});

describe('sidebarText', () => {
  it('selects the text leaves of a chat-list row', () => {
    expect(matches('sidebarText')).toEqual(['row-name', 'row-preview', 'row-time']);
  });

  it('leaves the row avatar to its own category', () => {
    expect(matches('sidebarText')).not.toContain('row-avatar');
    expect(matches('sidebarAvatars')).toEqual(['row-avatar']);
  });
});

describe('message targets', () => {
  it('selects message text without the empty layout node', () => {
    expect(matches('messageText')).toEqual(['msg-text']);
  });

  it('selects message media separately from message text', () => {
    expect(matches('messageMedia')).toEqual(['msg-photo']);
    expect(matches('messageText')).not.toContain('msg-photo');
  });
});

describe('diagnostics', () => {
  it('reports a match count for every selector in the registry', () => {
    const report = collectSelectorReport(DEFAULT_SETTINGS);
    expect(report.length).toBeGreaterThan(50);
    expect(report.every((entry) => entry.matches >= 0)).toBe(true);
    expect(report.filter((entry) => entry.matches > 0).length).toBeGreaterThan(0);
  });

  it('flags an invalid custom selector instead of throwing', () => {
    const report = collectSelectorReport({
      ...DEFAULT_SETTINGS,
      customSelectors: { messageText: ['::::nonsense'] },
    });
    expect(report.some((entry) => entry.matches === -1)).toBe(true);
  });
});
