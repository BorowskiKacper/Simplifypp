// Puppeteer E2E tests — requires real Chrome with extension loaded.
// Run with: npm run test:e2e  (excluded from default `npm test`)

const puppeteer = require('puppeteer');
const path = require('path');

const EXT_PATH = path.resolve(__dirname, '..');

let browser;

beforeAll(async () => {
  browser = await puppeteer.launch({
    headless: false, // Chrome extensions require non-headless mode
    args: [
      `--disable-extensions-except=${EXT_PATH}`,
      `--load-extension=${EXT_PATH}`,
      '--no-first-run',
    ],
  });
}, 30000);

afterAll(async () => {
  if (browser) await browser.close();
});

async function getExtensionId() {
  await new Promise(r => setTimeout(r, 1000));
  const targets = browser.targets();
  const sw = targets.find(t => t.type() === 'service_worker' && t.url().includes('background'));
  if (!sw) return null;
  // chrome-extension://<id>/background.js
  return sw.url().split('/')[2];
}

test('extension service worker registers', async () => {
  const id = await getExtensionId();
  expect(id).toBeTruthy();
}, 15000);

test('options page saves and loads URLs', async () => {
  const id = await getExtensionId();
  const page = await browser.newPage();
  await page.goto(`chrome-extension://${id}/options.html`);

  await page.focus('#urls');
  await page.type('#urls', 'https://example.com/job/1\nhttps://example.com/job/2');
  await page.click('#saveBtn');
  await new Promise(r => setTimeout(r, 300));

  const statusText = await page.$eval('#status', el => el.textContent);
  expect(statusText).toContain('2 URL');
  await page.close();
}, 20000);

test('popup controls respond', async () => {
  const id = await getExtensionId();
  const page = await browser.newPage();
  await page.goto(`chrome-extension://${id}/popup.html`);

  // Increment parallelism
  const before = await page.$eval('#parallelism', el => el.textContent);
  await page.click('#inc');
  await new Promise(r => setTimeout(r, 200));
  const after = await page.$eval('#parallelism', el => el.textContent);
  expect(parseInt(after)).toBe(parseInt(before) + 1);

  await page.close();
}, 20000);
