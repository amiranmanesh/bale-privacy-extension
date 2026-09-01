import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const readJson = (relative) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(relative, root)), 'utf8'));

const pkg = readJson('package.json');
const hosts = readJson('src/manifest/hosts.json');

export const TARGETS = /** @type {const} */ (['chrome', 'firefox']);

/** Extension id used on addons.mozilla.org. Must stay stable across releases. */
export const GECKO_ID = '{9699286f-8a2b-4bf9-94fa-f3b8aedb9814}';

const ICONS = {
  16: 'icons/icon-16.png',
  32: 'icons/icon-32.png',
  48: 'icons/icon-48.png',
  128: 'icons/icon-128.png',
};

/**
 * Both stores get Manifest V3, but the two engines disagree on one field:
 * Chrome runs the background as a service worker, Firefox as an event page
 * script list. Everything else is shared.
 *
 * @param {string} target one of {@link TARGETS}
 * @param {string} [version] defaults to the version in package.json
 * @returns {Record<string, any>} the manifest to write next to the bundles
 */
export function buildManifest(target, version = pkg.version) {
  const manifest = {
    manifest_version: 3,
    name: '__MSG_extension_name__',
    short_name: 'Bale Privacy',
    description: '__MSG_extension_description__',
    version,
    default_locale: 'en',
    icons: ICONS,
    permissions: ['storage'],
    content_scripts: [
      {
        matches: hosts.matches,
        js: ['content.js'],
        run_at: 'document_start',
        all_frames: false,
      },
    ],
    action: {
      default_popup: 'popup.html',
      default_title: '__MSG_action_title__',
      default_icon: ICONS,
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
    commands: {
      'toggle-privacy': {
        suggested_key: { default: 'Alt+Shift+B' },
        description: '__MSG_command_toggle__',
      },
    },
  };

  if (target === 'chrome') {
    manifest.background = { service_worker: 'background.js' };
    // `:has()` (used by the leaf-text selectors) landed in Chromium 105;
    // 111 is the first version where it is stable in every derivative we test.
    manifest.minimum_chrome_version = '111';
  } else if (target === 'firefox') {
    manifest.background = { scripts: ['background.js'] };
    manifest.browser_specific_settings = {
      gecko: {
        id: GECKO_ID,
        // Firefox shipped :has() in 121.
        strict_min_version: '121.0',
        // AMO requires an explicit consent declaration on every new listing.
        // The extension stores its settings locally and never phones home,
        // so the answer is the sentinel "none" rather than a category list.
        data_collection_permissions: { required: ['none'] },
      },
      // Firefox for Android installs an add-on only if it declares support
      // explicitly. The UI is a popup and a stylesheet, so there is nothing
      // desktop-specific to hold back.
      gecko_android: { strict_min_version: '121.0' },
    };
  } else {
    throw new Error(`Unknown target: ${target}`);
  }

  return manifest;
}
