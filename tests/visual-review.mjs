import { chromium } from '@playwright/test';
import { preview } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';

const server = await preview({ preview: { host: '127.0.0.1', port: 4173, strictPort: true } });
let browser;
async function revealForScreenshot(page) {
  await page.evaluate(async () => {
    const step = Math.max(480, innerHeight * 0.8);
    for (let top = 0; top < document.documentElement.scrollHeight; top += step) {
      window.scrollTo({ top, behavior: 'instant' });
      await new Promise(resolve => setTimeout(resolve, 65));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(180);
}
try {
  await mkdir('artifacts', { recursive: true });
  browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.locator('.loader').waitFor({ state: 'detached', timeout: 12000 });
  await page.locator('[data-scene-kind="home"] canvas').waitFor({ state: 'visible', timeout: 12000 });
  // Capture the completed workspace after its desk, laptop, books, and accessories assemble.
  await page.waitForTimeout(10500);
  const layouts = [];
  for (const [width, height] of [[1440, 1000], [390, 844], [320, 740], [360, 800], [375, 812], [430, 932], [768, 1024], [1024, 768], [1100, 900], [1920, 1080]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(150);
    const result = await page.evaluate(() => ({
      width: innerWidth,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      homeScene: Boolean(document.querySelector('[data-scene-kind="home"] canvas')),
      heading: document.querySelector('h1')?.textContent,
    }));
    layouts.push(result);
    if (width === 390 || width === 1440) {
      await revealForScreenshot(page);
      await page.screenshot({ path: `artifacts/home-${width}.png`, fullPage: true });
    }
    if (result.overflow > 1) {
      console.log(await page.evaluate(() => [...document.querySelectorAll('main *')].map(element => ({
        tag: element.tagName, className: String(element.className), left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right,
      })).filter(item => item.left < -1 || item.right > innerWidth + 1)));
      await page.screenshot({ path: `artifacts/overflow-${width}.png`, fullPage: true });
      throw new Error(`Horizontal overflow at ${width}px: ${result.overflow}px`);
    }
  }
  await page.goto('http://127.0.0.1:4173/contact', { waitUntil: 'domcontentloaded' });
  await page.locator('.loader').waitFor({ state: 'detached', timeout: 12000 });
  const contactHero = page.locator('[data-cinematic-hero="contact"]');
  if (!(await contactHero.isVisible()) || !(await contactHero.locator('h1').textContent()).includes('Build Something Extraordinary')) throw new Error('Production SPA contact hero did not resolve');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await revealForScreenshot(page);
  await page.screenshot({ path: 'artifacts/contact-1440.png', fullPage: true });
  const contactLoadsThree = await page.locator('[data-scene-kind="contact"] canvas').isVisible();
  if (!contactLoadsThree) throw new Error('The Contact page should render its dedicated 3D scene');
  for (const viewport of [{ label: 'desktop', width: 1440, height: 1000 }, { label: 'mobile', width: 390, height: 844 }]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('http://127.0.0.1:4173/contact', { waitUntil: 'domcontentloaded' });
    await page.locator('.loader').waitFor({ state: 'detached', timeout: 12000 });
    const scene = page.locator('[data-scene-kind="contact"]');
    await scene.locator('canvas').waitFor({ state: 'visible', timeout: 12000 });
    await page.waitForFunction(() => Number(document.querySelector('[data-scene-kind="contact"]')?.dataset.sceneDistance) > 0, null, { timeout: 12000 });
    const trigger = await scene.evaluate(node => {
      const top = node.getBoundingClientRect().top + window.scrollY;
      return { start: Math.max(0, top - innerHeight * 0.12), distance: Number(node.dataset.sceneDistance) };
    });
    for (const [state, fraction] of [['calling', 0.25], ['connected', 0.5], ['messages', 0.7], ['hold', 0.9]]) {
      await page.evaluate(({ start, distance, fraction: amount }) => window.scrollTo({ top: start + distance * amount, behavior: 'instant' }), { ...trigger, fraction });
      await page.waitForFunction((amount) => Number(document.querySelector('[data-scene-kind="contact"]')?.dataset.sceneProgress) >= Math.min(1, amount / 0.85) - 0.05, fraction, { timeout: 5000 });
      await page.waitForTimeout(350);
      await page.screenshot({ path: `artifacts/contact-${state}-${viewport.label}.png` });
    }
  }
  const routeLayouts = [];
  for (const route of ['/about', '/projects', '/skills', '/education', '/contact']) {
    for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: width < 500 ? 800 : 960 });
      await page.goto(`http://127.0.0.1:4173${route}`, { waitUntil: 'domcontentloaded' });
      await page.locator('h1').waitFor({ state: 'visible' });
      await page.locator(`[data-scene-kind="${route.slice(1)}"] canvas`).waitFor({ state: 'visible', timeout: 12000 });
      const result = await page.evaluate(() => ({
        route: location.pathname,
        width: innerWidth,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        heading: document.querySelector('h1')?.textContent,
      }));
      routeLayouts.push(result);
      if (width === 390 || width === 1440) {
        await revealForScreenshot(page);
        await page.screenshot({ path: `artifacts/${route.slice(1)}-${width}.png`, fullPage: true });
      }
      if (result.overflow > 1) {
        console.log(await page.evaluate(() => [...document.querySelectorAll('main *')].map((element) => ({
          tag: element.tagName,
          className: String(element.className),
          left: Math.round(element.getBoundingClientRect().left),
          right: Math.round(element.getBoundingClientRect().right),
        })).filter((item) => item.left < -1 || item.right > innerWidth + 1)));
        throw new Error(`Horizontal overflow on ${route} at ${width}px: ${result.overflow}px`);
      }
    }
  }
  if (errors.length) throw new Error(`Production browser errors: ${errors.join('; ')}`);
  const report = { productionRoute: '/contact', dedicatedContactSceneRendered: contactLoadsThree, browserErrors: errors, layouts, routeLayouts };
  await writeFile('artifacts/visual-review.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
