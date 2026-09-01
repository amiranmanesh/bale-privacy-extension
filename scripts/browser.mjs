#!/usr/bin/env node
/**
 * A driven browser for selector work.
 *
 * Bale Web needs a logged-in session, and its markup cannot be inspected from
 * the bundle alone, so selector changes are verified against a real page:
 *
 *   node scripts/browser.mjs open            launch a window and keep it alive
 *   node scripts/browser.mjs eval file.js    run a snippet in the Bale tab
 *   node scripts/browser.mjs shot out.png    screenshot the Bale tab
 *
 * The profile lives in .browser-profile/ (gitignored), so you log in once and
 * every later command reuses the session. `open` also exposes CDP on port 9222,
 * which is how the other commands attach to the same window.
 */
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const PROFILE_DIR = path.join(root, '.browser-profile');
const EXTENSION_DIR = path.join(root, 'dist/chrome');
const CDP_PORT = Number(process.env.BALE_CDP_PORT ?? 9222);
const START_URL = 'https://web.bale.ai/chat';

const [command, ...rest] = process.argv.slice(2);

/** Attaches to the window started by `open`. */
async function attach() {
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  const contexts = browser.contexts();
  const pages = contexts.flatMap((context) => context.pages());
  const page = pages.find((candidate) => candidate.url().includes('bale.ai')) ?? pages[0];
  if (!page) throw new Error('No page is open. Run `node scripts/browser.mjs open` first.');
  return { browser, page };
}

async function open() {
  await mkdir(PROFILE_DIR, { recursive: true });
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: null,
    args: [
      `--remote-debugging-port=${CDP_PORT}`,
      `--disable-extensions-except=${EXTENSION_DIR}`,
      `--load-extension=${EXTENSION_DIR}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
  });

  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(START_URL, { waitUntil: 'domcontentloaded' }).catch(() => undefined);

  console.log(`window open, CDP on ${CDP_PORT}, profile ${path.relative(root, PROFILE_DIR)}`);
  console.log('log in, then run: node scripts/browser.mjs eval <snippet.js>');

  // Stay alive until the window is closed or the process is killed.
  await new Promise((resolve) => {
    context.on('close', resolve);
    process.on('SIGINT', resolve);
    process.on('SIGTERM', resolve);
  });
  await context.close().catch(() => undefined);
}

async function evaluate(file) {
  if (!file) throw new Error('usage: browser.mjs eval <file.js>');
  const code = await readFile(path.resolve(file), 'utf8');
  const { browser, page } = await attach();
  try {
    const result = await page.evaluate(code);
    console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
}

async function shot(out = 'probe-out/page.png') {
  const target = path.resolve(out);
  await mkdir(path.dirname(target), { recursive: true });
  const { browser, page } = await attach();
  try {
    await page.screenshot({ path: target });
    console.log(`saved ${path.relative(root, target)}`);
  } finally {
    await browser.close();
  }
}

/** Real pointer hover, to exercise the reveal-on-hover rules. */
async function hover(selector, out = 'probe-out/hover.png') {
  if (!selector) throw new Error('usage: browser.mjs hover <selector> [out.png]');
  const target = path.resolve(out);
  await mkdir(path.dirname(target), { recursive: true });
  const { browser, page } = await attach();
  try {
    await page.locator(selector).first().hover({ timeout: 5000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: target });
    console.log(`hovered ${selector}, saved ${path.relative(root, target)}`);
  } finally {
    await browser.close();
  }
}

/** Opens an extension page (popup.html, options.html) in a tab. */
async function extension(page_ = 'popup.html', out = 'probe-out/extension.png') {
  const target = path.resolve(out);
  await mkdir(path.dirname(target), { recursive: true });
  const { browser } = await attach();
  try {
    const context = browser.contexts()[0];
    const worker = context.serviceWorkers?.()[0];
    const id = worker
      ? new URL(worker.url()).host
      : (() => {
          throw new Error('extension service worker not found');
        })();
    const tab = await context.newPage();
    await tab.goto(`chrome-extension://${id}/${page_}`);
    await tab.waitForTimeout(600);
    await tab.screenshot({ path: target, fullPage: true });
    console.log(`${page_} (${id}) saved to ${path.relative(root, target)}`);
    await tab.close();
  } finally {
    await browser.close();
  }
}

async function info() {
  const { browser, page } = await attach();
  try {
    console.log(JSON.stringify({ url: page.url(), title: await page.title() }, null, 2));
  } finally {
    await browser.close();
  }
}

const commands = {
  open,
  eval: () => evaluate(rest[0]),
  shot: () => shot(rest[0]),
  hover: () => hover(rest[0], rest[1]),
  extension: () => extension(rest[0], rest[1]),
  info,
};

const handler = commands[command];
if (!handler) {
  console.error(`usage: browser.mjs <${Object.keys(commands).join('|')}>`);
  process.exit(1);
}

await handler();
