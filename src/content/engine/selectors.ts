import type { TargetDefinition } from '../../common/types.js';

/**
 * ---------------------------------------------------------------------------
 * How Bale Web is targeted
 * ---------------------------------------------------------------------------
 * Bale Web is a React app bundled with webpack and CSS Modules, so every class
 * name in the DOM is a per-build hash (`_BKsFW`) and useless as an anchor.
 *
 * Three attribute families survive a rebuild, in decreasing order of trust:
 *
 * 1. `aria-label` — written by hand for accessibility, semantic and rarely
 *    churned: `dialog-item`, `message-item`, `avatar`, `member-dialog`,
 *    `ChatAppBar`, `editable-message-text`.
 * 2. `data-sentry-source-file` / `data-sentry-component` — emitted by Sentry's
 *    component-annotate plugin, derived from source file and component names:
 *    `Dialog.tsx`, `BaseBubble.tsx`, `Text.tsx`, `NewTextContainerFC`.
 * 3. `data-testid` — present on a handful of nodes: `photo-message`,
 *    `thumbnail`, `story-item`.
 *
 * Every selector below was verified against a logged-in session with
 * `scripts/browser.mjs`; docs/SELECTORS.md explains how to repeat that.
 *
 * Note the deliberate omissions: message timestamps (`Info.tsx`) and unread
 * badges (`count-badge-text`) stay sharp, because blurring them costs
 * legibility without hiding anything private.
 */

/** A chat row in the sidebar list. */
const DIALOG_ROW = ['[aria-label="dialog-item"]', '[data-sentry-source-file="Dialog.tsx"]'];

/** One message row in the open conversation. */
const MESSAGE_ROW = ['[aria-label="message-item"]', '[data-sentry-source-file="BaseBubble.tsx"]'];

/** A person row in the profile / group-members panel. */
const MEMBER_ROW = ['[aria-label="member-dialog"]', '[data-sentry-source-file="SmallDialog.tsx"]'];

const within = (containers: readonly string[], descendants: readonly string[]): string[] =>
  containers.flatMap((container) => descendants.map((d) => `${container} ${d}`));

export const TARGET_DEFINITIONS: TargetDefinition[] = [
  {
    id: 'sidebarText',
    labelKey: 'target_sidebarText',
    kind: 'text',
    // The chat name is a <bdi> (bidirectional isolation for mixed-script
    // names) and the preview text is a <span> under the row's [dir] wrapper.
    // A group preview is prefixed with the last sender, rendered as
    // `<div><span dir="auto">Name</span>: </div>` — the wrapper is matched so
    // the trailing colon blurs with the name instead of hanging there alone.
    // The timestamp and the unread badge match none of these, and stay sharp.
    selectors: [
      ...within(DIALOG_ROW, ['bdi', '[dir] span', 'span[dir]', 'div:has(> span[dir])']),
      // The archive row is not a dialog-item: it sits above the list and its
      // subtitle names the conversations inside it. Its own <bdi> is the
      // literal word "Archive", so that stays readable and the entry findable.
      // The `div` before the attribute is not decoration: some selector
      // engines (nwsapi, which jsdom and therefore the test suite use) fail to
      // parse an attribute selector as the first thing inside `:has(> …)`.
      '[dir]:has(> div[data-sentry-component="ArchiveAvatar"]) span',
    ],
  },
  {
    id: 'sidebarAvatars',
    labelKey: 'target_sidebarAvatars',
    kind: 'graphic',
    // An avatar container holds an <img>, an <svg> icon or a text initial, so
    // the container itself is the only thing that covers every case.
    selectors: [
      ...within(DIALOG_ROW, ['[aria-label="avatar"]']),
      '[data-testid="story-item"] [aria-label="avatar"]',
      '[data-sentry-component="ArchiveAvatar"] [aria-label="avatar"]',
      '[data-sentry-source-file="GroupedAvatar.tsx"]',
    ],
  },
  {
    id: 'headerPeer',
    labelKey: 'target_headerPeer',
    kind: 'text',
    selectors: ['[aria-label="ChatAppBar"] p'],
    mediaSelectors: ['[aria-label="ChatAppBar"] [aria-label="avatar"]'],
  },
  {
    id: 'messageText',
    labelKey: 'target_messageText',
    kind: 'text',
    // Text.tsx covers the bubble body and the quoted text of a reply preview;
    // `a p` covers the title and description of a link or document card.
    selectors: [
      '[data-sentry-source-file="Text.tsx"]',
      '[data-sentry-component="NewTextContainerFC"]',
      ...within(MESSAGE_ROW, ['a p']),
    ],
  },
  {
    id: 'senderNames',
    labelKey: 'target_senderNames',
    kind: 'text',
    // The sender line above a bubble in a group is the only <p> wrapping a
    // <span>; the timestamp <p> under the bubble holds its text directly.
    // Preview.tsx carries the name of whoever wrote the quoted message.
    selectors: [
      ...within(MESSAGE_ROW, ['p > span']),
      '[data-sentry-source-file="Preview.tsx"] span[dir]',
    ],
  },
  {
    id: 'messageMedia',
    labelKey: 'target_messageMedia',
    kind: 'graphic',
    selectors: [
      '[data-testid="photo-message"]',
      '[data-testid="thumbnail"]',
      '[data-sentry-source-file="Thumbnail.tsx"]',
      '[data-sentry-source-file="Media.preview.tsx"]',
      '[data-sentry-source-file="Photo.new.tsx"]',
      '[data-sentry-source-file="Video.new.tsx"]',
      '[data-sentry-source-file="NormalEmojiGrid.tsx"]',
      '[data-sentry-source-file="DocumentIcon.tsx"]',
      // Catch-all for media the anchors above miss, minus the sender avatar.
      ...within(MESSAGE_ROW, ['img:not([aria-label="avatar"] img)', 'video', 'canvas']),
    ],
  },
  {
    id: 'messageAvatars',
    labelKey: 'target_messageAvatars',
    kind: 'graphic',
    selectors: [...within(MESSAGE_ROW, ['[aria-label="avatar"]'])],
  },
  {
    id: 'composer',
    labelKey: 'target_composer',
    kind: 'text',
    selectors: ['[aria-label="editable-message-text"]', '#editable-message-text'],
  },
  {
    id: 'profilePanel',
    labelKey: 'target_profilePanel',
    kind: 'text',
    selectors: [...within(MEMBER_ROW, ['p']), '[data-sentry-source-file="GroupInfo.tsx"] bdi'],
    mediaSelectors: [
      ...within(MEMBER_ROW, ['[aria-label="avatar"]']),
      '[data-sentry-source-file="SharedMediaTabContentView.tsx"] img',
    ],
  },
];

/** Lookup helper; the list is tiny so a linear scan is fine. */
export const getTargetDefinition = (id: string): TargetDefinition | undefined =>
  TARGET_DEFINITIONS.find((definition) => definition.id === id);
