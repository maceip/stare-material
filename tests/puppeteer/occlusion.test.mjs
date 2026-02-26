import { spawn } from 'child_process';
import { once } from 'events';
import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const PORT = 4173;
const URL = `http://127.0.0.1:${PORT}`;
const SCREENSHOT_DIR = path.resolve('tests/screenshots');
const SCREENSHOT_PATH = path.join(SCREENSHOT_DIR, 'occlusion.png');

const waitForReady = async (stdout) => {
  let buffer = '';
  for await (const chunk of stdout) {
    buffer += chunk.toString();
    if (buffer.includes('Local:')) {
      return;
    }
  }
};

const startDevServer = () => {
  const proc = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    stdio: ['ignore', 'pipe', 'inherit'],
    env: process.env,
  });
  return proc;
};

const capture = async () => {
  const server = startDevServer();
  try {
    await waitForReady(server.stdout);
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('[page]', msg.text());
        if (msg.stackTrace) {
          for (const frame of msg.stackTrace()) {
            console.error('  at', frame.url, frame.lineNumber, frame.columnNumber);
          }
        }
      }
    });
    page.on('pageerror', (error) => {
      console.error('[pageerror]', error.message);
      console.error(error.stack);
    });
    await page.setViewport({ width: 1400, height: 900 });
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    const canvasCount = await page.evaluate(() => document.querySelectorAll('canvas').length);
    console.log('canvas count after load', canvasCount);
    await page.waitForSelector('canvas', { timeout: 60000 });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
    await browser.close();
    console.log(`Saved occlusion screenshot to ${SCREENSHOT_PATH}`);
  } finally {
    server.kill();
    await once(server, 'exit');
  }
};

capture().catch((error) => {
  console.error(error);
  process.exit(1);
});
