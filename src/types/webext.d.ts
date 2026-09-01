/**
 * Minimal ambient typings for the slice of the WebExtension API this project uses.
 *
 * We deliberately avoid `@types/chrome` / `webextension-polyfill`: the extension
 * touches four namespaces only (storage, runtime, commands, i18n), and both Chrome
 * (MV3) and Firefox (MV3) return promises for all of them.
 */

declare namespace WebExt {
  interface StorageChange {
    oldValue?: unknown;
    newValue?: unknown;
  }

  interface StorageArea {
    get(
      keys?: string | string[] | Record<string, unknown> | null,
    ): Promise<Record<string, unknown>>;
    set(items: Record<string, unknown>): Promise<void>;
    remove(keys: string | string[]): Promise<void>;
    clear(): Promise<void>;
  }

  interface StorageChangedEvent {
    addListener(cb: (changes: Record<string, StorageChange>, areaName: string) => void): void;
    removeListener(cb: (changes: Record<string, StorageChange>, areaName: string) => void): void;
  }

  interface Storage {
    sync?: StorageArea;
    local: StorageArea;
    onChanged: StorageChangedEvent;
  }

  interface InstalledDetails {
    reason: 'install' | 'update' | 'chrome_update' | 'browser_update' | 'shared_module_update';
    previousVersion?: string;
  }

  interface SimpleEvent<T extends unknown[]> {
    addListener(cb: (...args: T) => void): void;
    removeListener(cb: (...args: T) => void): void;
  }

  interface Runtime {
    id: string;
    getManifest(): { version: string; name: string; [key: string]: unknown };
    getURL(path: string): string;
    openOptionsPage?(): Promise<void>;
    onInstalled: SimpleEvent<[InstalledDetails]>;
    lastError?: { message?: string };
  }

  interface Commands {
    onCommand: SimpleEvent<[string]>;
  }

  interface I18n {
    getMessage(key: string, substitutions?: string | string[]): string;
    getUILanguage(): string;
  }

  interface Api {
    storage: Storage;
    runtime: Runtime;
    commands?: Commands;
    i18n: I18n;
  }
}

declare const chrome: WebExt.Api | undefined;
declare const browser: WebExt.Api | undefined;
