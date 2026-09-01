import type { HoldKey } from '../../common/types.js';
import type { RuntimeState } from './cssBuilder.js';
import { DEFAULT_RUNTIME_STATE } from './cssBuilder.js';

export interface ActivityWatcherOptions {
  /** Seconds of inactivity after which `idle` flips to true. 0 disables it. */
  idleSeconds: number;
  /** Modifier key that reveals everything while held. */
  holdKey: HoldKey;
  /** Whether the hold-to-reveal key is watched at all. */
  holdKeyEnabled: boolean;
}

type Listener = (state: RuntimeState) => void;

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'] as const;

/**
 * Tracks the three pieces of live state the stylesheet reacts to: window
 * focus, user idleness and the hold-to-reveal key.
 *
 * All listeners are passive and the idle timer is only re-armed at most once
 * per second, so an idle tab costs effectively nothing.
 */
export class ActivityWatcher {
  private state: RuntimeState = { ...DEFAULT_RUNTIME_STATE };
  private options: ActivityWatcherOptions;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private lastActivity = 0;
  private started = false;

  constructor(
    options: ActivityWatcherOptions,
    private readonly onChange: Listener,
    private readonly target: Window = window,
  ) {
    this.options = options;
    this.state.windowFocused = target.document.hasFocus();
  }

  start(): void {
    if (this.started) return;
    this.started = true;

    this.target.addEventListener('focus', this.handleFocus);
    this.target.addEventListener('blur', this.handleBlur);
    this.target.document.addEventListener('visibilitychange', this.handleVisibility);
    for (const type of ACTIVITY_EVENTS) {
      this.target.addEventListener(type, this.handleActivity, { passive: true, capture: true });
    }
    this.target.addEventListener('keydown', this.handleKeyDown, { capture: true });
    this.target.addEventListener('keyup', this.handleKeyUp, { capture: true });

    this.armIdleTimer();
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;

    this.target.removeEventListener('focus', this.handleFocus);
    this.target.removeEventListener('blur', this.handleBlur);
    this.target.document.removeEventListener('visibilitychange', this.handleVisibility);
    for (const type of ACTIVITY_EVENTS) {
      this.target.removeEventListener(type, this.handleActivity, { capture: true });
    }
    this.target.removeEventListener('keydown', this.handleKeyDown, { capture: true });
    this.target.removeEventListener('keyup', this.handleKeyUp, { capture: true });

    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
  }

  update(options: ActivityWatcherOptions): void {
    this.options = options;
    if (!options.holdKeyEnabled && this.state.peeking) this.patch({ peeking: false });
    this.armIdleTimer();
  }

  getState(): RuntimeState {
    return { ...this.state };
  }

  private patch(partial: Partial<RuntimeState>): void {
    const next = { ...this.state, ...partial };
    if (
      next.windowFocused === this.state.windowFocused &&
      next.idle === this.state.idle &&
      next.peeking === this.state.peeking
    ) {
      return;
    }
    this.state = next;
    this.onChange(this.getState());
  }

  private readonly handleFocus = (): void => {
    this.markActive();
    this.patch({ windowFocused: true });
  };

  private readonly handleBlur = (): void => {
    // A key held while the window loses focus never receives its keyup.
    this.patch({ windowFocused: false, peeking: false });
  };

  private readonly handleVisibility = (): void => {
    if (this.target.document.visibilityState === 'hidden') {
      this.patch({ windowFocused: false, peeking: false });
    } else {
      this.markActive();
      this.patch({ windowFocused: this.target.document.hasFocus() });
    }
  };

  private readonly handleActivity = (): void => {
    this.markActive();
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.options.holdKeyEnabled) return;
    if (event.key === this.options.holdKey) this.patch({ peeking: true });
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (event.key === this.options.holdKey) this.patch({ peeking: false });
  };

  private markActive(): void {
    const now = Date.now();
    if (this.state.idle) this.patch({ idle: false });
    // Re-arming the timeout on every mousemove would be wasteful; one second of
    // granularity is far below the smallest configurable idle timeout.
    if (now - this.lastActivity < 1000) return;
    this.lastActivity = now;
    this.armIdleTimer();
  }

  private armIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
    if (this.options.idleSeconds <= 0) return;
    this.idleTimer = setTimeout(() => this.patch({ idle: true }), this.options.idleSeconds * 1000);
  }
}
