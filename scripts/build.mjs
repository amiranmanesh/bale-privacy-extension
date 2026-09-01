#!/usr/bin/env node
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import path from 'node:path';
import esbuild from 'esbuild';
import { TARGETS, buildManifest } from './manifest.mjs';

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const resolve = (...parts) => path.join(root, ...parts);

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const watch = flag('watch');
const zip = flag('zip');
const dev = watch || flag('dev');
const requested = option('target', 'all');
const targets = requested === 'all' ? [...TARGETS] : [requested];

for (const target of targets) {
  if (!TARGETS.includes(target)) {
    console.error(`Unknown target "${target}". Expected one of: ${TARGETS.join(', ')}`);
    process.exit(1);
  }
}

/** Bundles that must be classic scripts: MV3 forbids ESM content scripts. */
const ENTRIES = [
  { in: 'src/content/index.ts', out: 'content' },
  { in: 'src/background/index.ts', out: 'background' },
  { in: 'src/ui/popup/popup.ts', out: 'popup' },
  { in: 'src/ui/options/options.ts', out: 'options' },
];

const STATIC_FILES = [
  { from: 'src/ui/popup/popup.html', to: 'popup.html' },
  { from: 'src/ui/popup/popup.css', to: 'popup.css' },
  { from: 'src/ui/options/options.html', to: 'options.html' },
  { from: 'src/ui/options/options.css', to: 'options.css' },
  { from: 'src/ui/shared.css', to: 'shared.css' },
  { from: 'public/_locales', to: '_locales' },
];

/**
 * Only the sizes the manifest references. public/icons also holds 256 and 512
 * for the website and the store listing; shipping them would add ~48 KB of dead
 * weight to every package.
 */
const ICON_SIZES = [16, 32, 48, 128];

async function ensureIcons() {
  if (existsSync(resolve('public/icons/icon-128.png'))) return;
  console.log('· icons missing, generating them');
  await execFileAsync(process.execPath, [resolve('scripts/gen-icons.mjs')]);
}

async function buildTarget(target) {
  const outdir = resolve('dist', target);
  await rm(outdir, { recursive: true, force: true });
  await mkdir(outdir, { recursive: true });

  const context = await esbuild.context({
    entryPoints: ENTRIES.map((entry) => ({ in: resolve(entry.in), out: entry.out })),
    outdir,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: target === 'firefox' ? ['firefox121'] : ['chrome111'],
    sourcemap: dev ? 'inline' : false,
    minify: !dev,
    legalComments: 'none',
    define: { __DEV__: String(dev), __TARGET__: JSON.stringify(target) },
    logLevel: 'warning',
  });

  await context.rebuild();

  for (const file of STATIC_FILES) {
    await cp(resolve(file.from), path.join(outdir, file.to), { recursive: true });
  }

  await mkdir(path.join(outdir, 'icons'), { recursive: true });
  for (const size of ICON_SIZES) {
    await cp(resolve(`public/icons/icon-${size}.png`), path.join(outdir, `icons/icon-${size}.png`));
  }

  const pkg = JSON.parse(await readFile(resolve('package.json'), 'utf8'));
  await writeFile(
    path.join(outdir, 'manifest.json'),
    `${JSON.stringify(buildManifest(target, pkg.version), null, 2)}\n`,
  );

  console.log(`✓ ${target} → dist/${target}`);
  return { context, outdir };
}

/**
 * Zips without a dependency by shelling out to the system `zip`.
 *
 * The store validators reject an archive that nests the extension in a folder
 * and warn about every dotfile in it, so the archive is built from inside
 * `dist/<target>` with `-X` (no extra attributes, no `__MACOSX/`) and dotfiles
 * excluded. Never repackage a build with Finder's "Compress" — it does both of
 * the things this guards against.
 */
async function zipTarget(target, version) {
  const releaseDir = resolve('release');
  await mkdir(releaseDir, { recursive: true });
  const archive = path.join(releaseDir, `bale-privacy-${version}-${target}.zip`);
  await rm(archive, { force: true });
  const cwd = resolve('dist', target);
  await execFileAsync('zip', ['-r', '-q', '-X', archive, '.', '-x', '.*', '*/.*'], { cwd });
  await assertPackagedForStores(archive);
  console.log(`✓ ${target} → ${path.relative(root, archive)}`);
}

/** Fails the build rather than shipping an archive a store would reject. */
async function assertPackagedForStores(archive) {
  const { stdout } = await execFileAsync('unzip', ['-Z1', archive]);
  const entries = stdout.split('\n').filter(Boolean);
  if (!entries.includes('manifest.json')) {
    throw new Error(`${path.basename(archive)}: manifest.json is not at the archive root`);
  }
  const hidden = entries.filter((entry) => entry.split('/').some((part) => part.startsWith('.')));
  if (hidden.length > 0) {
    throw new Error(`${path.basename(archive)}: hidden files in the archive: ${hidden.join(', ')}`);
  }
}

async function main() {
  await ensureIcons();
  const built = [];
  for (const target of targets) built.push(await buildTarget(target));

  if (zip) {
    const pkg = JSON.parse(await readFile(resolve('package.json'), 'utf8'));
    for (const target of targets) await zipTarget(target, pkg.version);
  }

  if (!watch) {
    for (const { context } of built) await context.dispose();
    return;
  }

  console.log('· watching for changes (ctrl-c to stop)');
  for (const { context } of built) await context.watch();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
