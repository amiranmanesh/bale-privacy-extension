#!/usr/bin/env node
/**
 * Produces the marketing and store screenshots.
 *
 * Everything is rendered from a fabricated conversation (site/demo.html) and a
 * stubbed extension API, so no real account, message or contact ever appears in
 * a published image. The blur is applied with the extension's own stylesheet
 * generator, so the screenshots show exactly what users get.
 *
 *   node scripts/screenshots.mjs
 */
import { mkdir, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import esbuild from 'esbuild';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const resolve = (...parts) => path.join(root, ...parts);
const OUT = resolve('site/assets');
const SIZE = { width: 1280, height: 800 };

/** Bundles the engine so this script can use the very same CSS the users get. */
async function loadEngine() {
  const outfile = resolve('.tmp/engine.mjs');
  await mkdir(path.dirname(outfile), { recursive: true });
  await esbuild.build({
    entryPoints: [resolve('src/content/engine/cssBuilder.ts')],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    logLevel: 'error',
  });
  return import(pathToFileURL(outfile).href);
}

async function main() {
  const engine = await loadEngine();
  const { DEFAULT_SETTINGS } = await import(pathToFileURL(await bundleSettings()).href);

  await mkdir(OUT, { recursive: true });
  // `channel: 'chromium'` uses the full browser build; the default headless
  // shell is a separate download that is not always available.
  const browser = await chromium.launch({ channel: 'chromium' });
  const context = await browser.newContext({ viewport: SIZE, deviceScaleFactor: 2 });
  const page = await context.newPage();

  const css = engine.buildStylesheet();
  const tokens = engine.computeStateTokens(DEFAULT_SETTINGS, engine.DEFAULT_RUNTIME_STATE);
  const vars = engine.computeCssVars(DEFAULT_SETTINGS);

  await page.goto(pathToFileURL(resolve('site/demo.html')).href);
  await page.screenshot({ path: path.join(OUT, 'screenshot-plain.png') });

  await page.addStyleTag({ content: css });
  await page.evaluate(
    ([tokenList, cssVars]) => {
      document.documentElement.setAttribute('data-bale-privacy', tokenList.join(' '));
      for (const [name, value] of Object.entries(cssVars)) {
        document.documentElement.style.setProperty(name, value);
      }
    },
    [tokens, vars],
  );
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, 'screenshot-blurred.png') });

  // Hover one chat row to show the reveal.
  await page.locator('[aria-label="dialog-item"]').nth(1).hover();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'screenshot-hover.png') });

  await shootExtensionPage(context, 'popup.html', 'screenshot-popup.png', 360);
  await shootExtensionPage(context, 'options.html', 'screenshot-options.png', 1120);

  await browser.close();
  await rm(resolve('.tmp'), { recursive: true, force: true });
  console.log(`✓ screenshots in ${path.relative(root, OUT)}`);
}

/** Bundles the settings module so the defaults come from one place. */
async function bundleSettings() {
  const outfile = resolve('.tmp/settings.mjs');
  await esbuild.build({
    entryPoints: [resolve('src/common/settings.ts')],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    logLevel: 'error',
  });
  return outfile;
}

/**
 * Renders popup.html / options.html with a stubbed extension API, then centres
 * the result on a neutral canvas at store dimensions.
 */
async function shootExtensionPage(context, file, out, width) {
  const page = await context.newPage();
  await page.addInitScript(() => {
    const settings = {};
    globalThis.chrome = {
      i18n: { getMessage: () => '', getUILanguage: () => 'en' },
      runtime: { id: 'demo', getManifest: () => ({ version: '0.1.0' }), openOptionsPage: () => {} },
      storage: {
        sync: {
          get: async () => ({ ...settings }),
          set: async (items) => Object.assign(settings, items),
        },
        local: { get: async () => ({}), set: async () => {} },
        onChanged: { addListener: () => {}, removeListener: () => {} },
      },
    };
  });
  await page.goto(pathToFileURL(resolve('dist/chrome', file)).href);
  await page.waitForTimeout(700);

  const shot = await page.locator('body').screenshot();
  await page.setContent(
    `<style>
       html,body{margin:0;height:100%}
       body{display:grid;place-items:center;
            background:linear-gradient(135deg,#eef2ff,#f5f3ff 60%,#fdf4ff)}
       img{width:${width}px;border-radius:14px;box-shadow:0 24px 60px rgb(30 27 75 / 22%)}
     </style>
     <img src="data:image/png;base64,${shot.toString('base64')}" />`,
  );
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, out) });
  await page.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
