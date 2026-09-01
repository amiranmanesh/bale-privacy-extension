/**
 * Every part of the Bale Web UI the extension can obfuscate independently.
 * The ids are stable: they are persisted in user settings and used as CSS
 * state tokens, so renaming one requires a settings migration.
 */
export const TARGET_IDS = [
  'sidebarText',
  'sidebarAvatars',
  'headerPeer',
  'messageText',
  'messageMedia',
  'messageAvatars',
  'composer',
  'profileMedia',
] as const;

export type TargetId = (typeof TARGET_IDS)[number];

/** How a target is hidden. Text uses a shadow trick, media uses a real blur. */
export type ObfuscationKind = 'text' | 'graphic';

/** Modifier key that reveals everything while held down. */
export const HOLD_KEYS = ['Alt', 'Control', 'Shift'] as const;
export type HoldKey = (typeof HOLD_KEYS)[number];

export interface Settings {
  /** Bumped whenever the shape changes; drives {@link migrateSettings}. */
  schemaVersion: number;
  /** Master switch. When false the extension does nothing at all. */
  enabled: boolean;
  /** Per-area switches. */
  targets: Record<TargetId, boolean>;
  /** Blur strength in CSS pixels. */
  blurRadius: number;
  /** Reveal a single element while the pointer is over it. */
  revealOnHover: boolean;
  /** Hover intent delay in milliseconds before an element is revealed. */
  revealDelayMs: number;
  /** Reveal everything while {@link Settings.holdKey} is held. */
  holdKeyReveal: boolean;
  holdKey: HoldKey;
  /** Force blur back on as soon as the window loses focus. */
  blurOnWindowBlur: boolean;
  /** Force blur back on after a period without keyboard/pointer activity. */
  blurOnIdle: boolean;
  idleSeconds: number;
  /** Fade blur in and out instead of switching instantly. */
  animate: boolean;
  /** Extra CSS selectors appended per target, edited on the options page. */
  customSelectors: Partial<Record<TargetId, string[]>>;
  /** Logs selector match counts to the page console. */
  debug: boolean;
}

/** A group of CSS selectors that all receive the same treatment. */
export interface TargetDefinition {
  id: TargetId;
  /** i18n key for the label shown in the popup / options page. */
  labelKey: string;
  kind: ObfuscationKind;
  /**
   * Selectors ordered from most specific to broadest. Every entry is applied;
   * the ordering only documents intent and helps when pruning stale ones.
   */
  selectors: string[];
}
