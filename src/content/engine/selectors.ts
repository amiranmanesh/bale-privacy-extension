import type { TargetDefinition } from '../../common/types.js';

/**
 * ---------------------------------------------------------------------------
 * How Bale Web is targeted
 * ---------------------------------------------------------------------------
 * Bale Web is a React app bundled with webpack + CSS Modules, so every class
 * name in the DOM is a per-build hash (`_BKsFW`). Those are useless as
 * selectors: they change on every deploy.
 *
 * The bundle is however built with Sentry's component-annotate plugin, which
 * leaves three stable, source-derived attributes on the rendered elements:
 *
 *   data-sentry-component="MessagesListFC"        (React component name)
 *   data-sentry-element="DialogItem"              (JSX element name)
 *   data-sentry-source-file="DialogItemWrapper.tsx"
 *
 * Those are what we anchor on. A handful of `data-testid` attributes and one
 * hand-written class (`._message-item`) survive minification as well and act
 * as a second layer.
 *
 * On top of the anchors we use a *region + leaf* strategy: pick a container we
 * are confident about, then blur only its leaf elements (nodes with no element
 * children). That obfuscates the text without wrapping large layout containers
 * in a `filter`, which would create a containing block and break the app's
 * fixed-position menus.
 *
 * See docs/SELECTORS.md for how to re-derive this list against a new build.
 */

/**
 * Leaf elements that carry text: no element children, not empty, not media.
 * `:has()` is kept last so the selector also parses in engines that only
 * support it at the end of a compound (notably jsdom, which the tests use).
 */
const LEAF =
  '*:not(:empty, img, svg, canvas, video, input, textarea, br):not(:has(*))';

/** Elements that render a picture, wherever they appear. */
const GRAPHIC = ['img', 'canvas', 'video', 'svg[width]'] as const;

/** Containers we trust to be "one row in the chat list". */
const SIDEBAR_ROW = [
  '[data-sentry-element="DialogItem"]',
  '[data-sentry-source-file="DialogItemWrapper.tsx"]',
  '[data-sentry-component="ShortDialogSearchResult"]',
  '[data-sentry-component="PeerSearchResult"]',
  '[data-sentry-component="TopPeerItem"]',
] as const;

/** Containers we trust to be "the scrolling message history". */
const MESSAGE_LIST = [
  '[data-sentry-component="MessagesListFC"]',
  '[data-sentry-component="NewMessagesList"]',
  '[data-sentry-source-file="MessagesList.new.tsx"]',
  '._message-item',
] as const;

/** The bubble body of a single message. */
const MESSAGE_BODY = [
  '[data-sentry-component="MessageContent"]',
  '[data-sentry-component="TextWithLinkSummary"]',
  '[data-sentry-element="TextMessage"]',
  '[data-sentry-component="ConnectedMessageSlot"]',
] as const;

/** The header above an open conversation (peer name, member count, last seen). */
const PEER_HEADER = [
  '[data-sentry-component="ToolbarFC"]',
  '[data-sentry-element="ToolbarContent"]',
  '[data-sentry-source-file="PeerToolbar.tsx"]',
  '[data-sentry-source-file="Toolbar.tsx"]',
] as const;

/** The message composer. */
const COMPOSER = [
  '[data-sentry-component="FeditableMessageInputFC"]',
  '[data-sentry-source-file="FeditableMessageInput.tsx"]',
  '[data-testid="message-text-area"]',
] as const;

/** Profile / peer-info surfaces outside the message list. */
const PROFILE = [
  '[data-sentry-component="AboutFC"]',
  '[data-sentry-component="GroupPeerFC"]',
  '[data-sentry-component="SeenerList"]',
  '[data-sentry-component="AvatarCommandItem"]',
] as const;

/** Cartesian product of containers and descendant patterns. */
const within = (containers: readonly string[], descendants: readonly string[]): string[] =>
  containers.flatMap((container) => descendants.map((d) => `${container} ${d}`));

export const TARGET_DEFINITIONS: TargetDefinition[] = [
  {
    id: 'sidebarText',
    labelKey: 'target_sidebarText',
    kind: 'text',
    selectors: within(SIDEBAR_ROW, [LEAF]),
  },
  {
    id: 'sidebarAvatars',
    labelKey: 'target_sidebarAvatars',
    kind: 'graphic',
    selectors: [
      ...within(SIDEBAR_ROW, GRAPHIC),
      '[data-sentry-component="ArchiveAvatar"]',
      '[data-sentry-element="AvatarItem"]',
    ],
  },
  {
    id: 'headerPeer',
    labelKey: 'target_headerPeer',
    kind: 'text',
    selectors: [...within(PEER_HEADER, [LEAF]), ...within(PEER_HEADER, GRAPHIC)],
  },
  {
    id: 'messageText',
    labelKey: 'target_messageText',
    kind: 'text',
    selectors: [
      ...within(MESSAGE_BODY, [LEAF]),
      ...within(MESSAGE_LIST, ['[data-sentry-element="TextMessage"]']),
    ],
  },
  {
    id: 'messageMedia',
    labelKey: 'target_messageMedia',
    kind: 'graphic',
    selectors: [
      ...within(MESSAGE_LIST, GRAPHIC),
      '[data-sentry-component="AlbumFC"]',
      '[data-sentry-component="AlbumMediaFC"]',
      '[data-sentry-component="GifMessage"]',
      '[data-sentry-component="StickerMessage"]',
      '[data-sentry-component="PhotoWithShimmer"]',
      '[data-sentry-component="VideoWithShimmer"]',
      '[data-testid="sticker-message"]',
      '[data-testid="original-photo"]',
      '[data-testid="video-wrapper"]',
      '[data-testid="document-message"]',
    ],
  },
  {
    id: 'messageAvatars',
    labelKey: 'target_messageAvatars',
    kind: 'graphic',
    selectors: [
      ...within(
        ['[data-sentry-component="GroupPeerFC"]', '[data-sentry-element="AvatarItem"]'],
        [...GRAPHIC],
      ),
      '[data-sentry-component="SeenerList"] img',
    ],
  },
  {
    id: 'composer',
    labelKey: 'target_composer',
    kind: 'text',
    selectors: [...COMPOSER],
  },
  {
    id: 'profileMedia',
    labelKey: 'target_profileMedia',
    kind: 'graphic',
    selectors: [...within(PROFILE, GRAPHIC), ...within(PROFILE, [LEAF])],
  },
];

/** Lookup helper; the list is tiny so a linear scan is fine. */
export const getTargetDefinition = (id: string): TargetDefinition | undefined =>
  TARGET_DEFINITIONS.find((definition) => definition.id === id);
