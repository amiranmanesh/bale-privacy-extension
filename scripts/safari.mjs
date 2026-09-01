#!/usr/bin/env node
/**
 * Generates (and optionally builds) the Safari target.
 *
 * Safari is the one browser that cannot install a zip: an extension has to be
 * embedded in a macOS/iOS app and distributed through the App Store. Apple's
 * `safari-web-extension-converter` wraps our Chromium package in exactly such
 * an app, so there is no second source tree to maintain — the Xcode project is
 * a build artifact, regenerated on demand and kept out of git.
 *
 *   node scripts/safari.mjs                 generate safari/ from dist/chrome
 *   node scripts/safari.mjs --build         also compile it (unsigned)
 *   node scripts/safari.mjs --open          open the project in Xcode
 *
 * Requires macOS with Xcode installed. Publishing additionally requires
 * membership of the Apple Developer Program; see docs/BROWSER-SUPPORT.md.
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const resolve = (...parts) => path.join(root, ...parts);

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const APP_NAME = option('app-name', 'Bale Privacy');
/**
 * The converter derives the app's bundle id from the app name and the
 * extension's from this value. Xcode then refuses to embed the extension
 * unless its id is prefixed by the app's, so the last component has to match
 * the app name with spaces replaced by hyphens.
 */
const BUNDLE_ID = option('bundle-id', 'com.github.amiranmanesh.Bale-Privacy');
const SOURCE = resolve('dist/chrome');
const OUT_DIR = resolve('safari');
const PROJECT = path.join(OUT_DIR, APP_NAME, `${APP_NAME}.xcodeproj`);

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function preflight() {
  if (process.platform !== 'darwin') {
    fail('Safari packaging needs macOS: the converter and Xcode ship with the OS.');
  }
  try {
    await execFileAsync('xcrun', ['--find', 'safari-web-extension-converter']);
  } catch {
    fail(
      'safari-web-extension-converter not found.\n' +
        'Install Xcode from the App Store, then run:\n' +
        '  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer\n' +
        '  xcodebuild -runFirstLaunch',
    );
  }
  if (!existsSync(path.join(SOURCE, 'manifest.json'))) {
    fail('dist/chrome is missing. Run `npm run build:chrome` first.');
  }
  const expectedSuffix = APP_NAME.replaceAll(' ', '-');
  if (!BUNDLE_ID.endsWith(expectedSuffix)) {
    fail(
      `--bundle-id must end with "${expectedSuffix}" so the extension's bundle id ` +
        `stays prefixed by the app's, which Xcode requires when embedding it.`,
    );
  }
}

async function convert() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const { stdout, stderr } = await execFileAsync('xcrun', [
    'safari-web-extension-converter',
    SOURCE,
    '--project-location',
    OUT_DIR,
    '--app-name',
    APP_NAME,
    '--bundle-identifier',
    BUNDLE_ID,
    '--macos-only',
    // Copy rather than reference dist/chrome, so the project keeps building
    // after a `npm run clean`.
    '--copy-resources',
    '--no-open',
    '--no-prompt',
    '--force',
  ]);

  const output = `${stdout}${stderr}`;
  // The converter warns about options_ui.open_in_tab, which Safari ignores and
  // opens in its own way. Anything else is worth reading.
  for (const line of output.split('\n')) {
    if (line.trim().length > 0) console.log(`  ${line.trim()}`);
  }
  console.log(`\n✓ project → ${path.relative(root, PROJECT)}`);
}

async function build() {
  console.log('· compiling (unsigned, to check the project builds)');
  await execFileAsync(
    'xcodebuild',
    [
      '-project',
      PROJECT,
      '-scheme',
      APP_NAME,
      '-configuration',
      'Release',
      '-derivedDataPath',
      path.join(OUT_DIR, 'build'),
      'CODE_SIGNING_ALLOWED=NO',
      'CODE_SIGNING_REQUIRED=NO',
      'CODE_SIGN_IDENTITY=',
      'build',
    ],
    { maxBuffer: 32 * 1024 * 1024 },
  );
  console.log(
    `✓ built → ${path.relative(root, path.join(OUT_DIR, 'build/Build/Products/Release'))}`,
  );
}

await preflight();
await convert();
if (flag('build')) await build();
if (flag('open')) await execFileAsync('open', [PROJECT]);

console.log(
  [
    '',
    'Next steps:',
    '  1. open safari/Bale Privacy/Bale Privacy.xcodeproj',
    '  2. pick your team under Signing & Capabilities for BOTH targets',
    '  3. Product → Run, then enable the extension in Safari → Settings → Extensions',
    '     (unsigned builds also need Develop → Allow Unsigned Extensions)',
    '  4. to publish: Product → Archive, then upload to App Store Connect',
    '',
    'Publishing needs an Apple Developer Program membership. See docs/BROWSER-SUPPORT.md.',
  ].join('\n'),
);
