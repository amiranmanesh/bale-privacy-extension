// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../src/common/settings.js';
import { collectSelectorReport } from '../src/content/engine/diagnostics.js';
import { mediaSelectorsForTarget, selectorsForTarget } from '../src/content/engine/cssBuilder.js';
import { getTargetDefinition } from '../src/content/engine/selectors.js';

/**
 * A reduced copy of the real Bale Web markup, transcribed from a logged-in
 * session with scripts/browser.mjs. Keeping the shape (a <bdi> chat name, a
 * preview under a [dir] wrapper, a sender name as the only p > span, the
 * timestamp as a bare <p> under Info.tsx) is what makes these assertions
 * meaningful rather than circular.
 */
const FIXTURE = `
  <div aria-label="dialog-item" data-sentry-source-file="Dialog.tsx">
    <div></div>
    <div id="row-avatar" aria-label="avatar"><img src="a.png" alt="M" /></div>
    <div>
      <div>
        <div><bdi id="row-name">Maryam</bdi></div>
        <span id="row-time">12:04</span>
      </div>
      <div title="see you tomorrow">
        <div><div dir="rtl"><span id="row-preview">see you tomorrow</span></div></div>
        <div><svg aria-label="pinned"></svg></div>
      </div>
      <span id="row-badge" aria-label="count-badge-text">3</span>
    </div>
  </div>

  <div aria-label="message-item" data-sid="client-message:1" data-date="1">
    <div>
      <div><div id="msg-avatar" aria-label="avatar"><span>A</span></div></div>
      <div data-sentry-component="BaseBubbleFC" data-sentry-source-file="BaseBubble.tsx">
        <div>
          <div><p><span id="sender-name">Ali</span></p></div>
          <div data-sentry-component="Preview" data-sentry-source-file="Preview.tsx">
            <div id="reply-photo" data-testid="photo-message">
              <div data-sentry-source-file="Thumbnail.tsx">
                <img id="reply-thumb" data-testid="thumbnail" src="t.jpg" alt="" />
              </div>
            </div>
          </div>
          <div>
            <div id="msg-text" data-sentry-component="NewTextContainerFC"
                 data-sentry-source-file="Text.tsx">
              <span>the pin is <strong>4417</strong></span>
            </div>
            <div data-sentry-component="MessageBottomFC" data-sentry-source-file="MessageBottom.tsx">
              <div data-sentry-source-file="Info.tsx"><p id="msg-time">12:05</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div aria-label="ChatAppBar">
    <div id="hdr-avatar" aria-label="avatar"><img src="h.png" alt="G" /></div>
    <div><p id="hdr-name">Team</p></div>
  </div>
`;

/** Ids matched by a target, including its picture-only selectors. */
const matches = (targetId: string): string[] => {
  const definition = getTargetDefinition(targetId);
  if (!definition) throw new Error(`no definition for ${targetId}`);
  const found = new Set<string>();
  for (const selector of [
    ...selectorsForTarget(definition),
    ...mediaSelectorsForTarget(definition),
  ]) {
    for (const element of document.querySelectorAll(selector)) {
      if (element.id) found.add(element.id);
    }
  }
  return [...found].sort();
};

beforeEach(() => {
  document.body.innerHTML = FIXTURE;
});

describe('chat list', () => {
  it('blurs the chat name and the message preview', () => {
    expect(matches('sidebarText')).toEqual(['row-name', 'row-preview']);
  });

  it('leaves the timestamp and the unread badge readable', () => {
    const blurred = matches('sidebarText');
    expect(blurred).not.toContain('row-time');
    expect(blurred).not.toContain('row-badge');
  });

  it('blurs the row avatar under its own switch', () => {
    expect(matches('sidebarAvatars')).toEqual(['row-avatar']);
    expect(matches('sidebarText')).not.toContain('row-avatar');
  });
});

describe('messages', () => {
  it('blurs the bubble text even when it contains inline markup', () => {
    expect(matches('messageText')).toEqual(['msg-text']);
  });

  it('never blurs the timestamp under the bubble', () => {
    for (const target of ['messageText', 'senderNames', 'messageMedia']) {
      expect(matches(target), target).not.toContain('msg-time');
    }
  });

  it('blurs the sender name in a group', () => {
    expect(matches('senderNames')).toEqual(['sender-name']);
  });

  it('blurs media and thumbnails, but not the sender avatar', () => {
    expect(matches('messageMedia')).toEqual(['reply-photo', 'reply-thumb']);
    expect(matches('messageMedia')).not.toContain('msg-avatar');
    expect(matches('messageAvatars')).toEqual(['msg-avatar']);
  });
});

describe('conversation header', () => {
  it('blurs the peer name and photo under one switch', () => {
    expect(matches('headerPeer')).toEqual(['hdr-avatar', 'hdr-name']);
  });
});

describe('diagnostics', () => {
  it('reports a match count for every selector in the registry', () => {
    const report = collectSelectorReport(DEFAULT_SETTINGS);
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
