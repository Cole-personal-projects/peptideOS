import { expect, test, type Page } from '@playwright/test';

async function acceptDisclaimer(page: Page) {
  await page.getByRole('button', { name: 'I Understand' }).click({ timeout: 5_000 }).catch(() => {});
}

async function createStack(page: Page) {
  await page.goto('/stacks');
  await acceptDisclaimer(page);
  await page.getByRole('button', { name: 'New protocol' }).click();
  await page.getByLabel('Protocol Name').fill('Layout Smoke Stack');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('checkbox', { name: 'BPC-157' }).check();
  await page.getByRole('button', { name: 'Create Protocol' }).click();
  const href = await page.getByRole('link', { name: /Layout Smoke Stack/ }).first().getAttribute('href');
  if (!href) throw new Error('Expected created stack link to expose a detail href.');
  return href;
}

async function expectNoBottomNavOverlap(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(150);

  const metrics = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    const navTop = nav?.getBoundingClientRect().top ?? window.innerHeight;
    const contentRoot = document.querySelector('main') ?? document.body;
    const selectors = [
      'main a',
      'main button',
      'main input',
      'main textarea',
      'main select',
      'main [role="button"]',
      'main h1',
      'main h2',
      'main h3',
      'main p',
      'main [data-layout-smoke-bottom]',
    ].join(',');

    const candidates = Array.from(contentRoot.querySelectorAll<HTMLElement>(selectors))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0
          && rect.height > 0
          && style.visibility !== 'hidden'
          && style.display !== 'none'
          && style.position !== 'fixed'
          && rect.bottom > 0
          && rect.top < window.innerHeight;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          text: (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 80),
          top: rect.top,
          bottom: rect.bottom,
        };
      })
      .sort((a, b) => b.bottom - a.bottom);

    const lowest = candidates[0] ?? null;
    return {
      navTop,
      lowest,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });

  expect(metrics.scrollWidth, 'page should not horizontally overflow').toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.lowest, 'expected visible page content near bottom of route').not.toBeNull();
  expect(metrics.lowest!.bottom, `lowest visible content should clear bottom nav: ${JSON.stringify(metrics.lowest)}`)
    .toBeLessThanOrEqual(metrics.navTop - 4);
}

test.describe('mobile layout smoke', () => {
  test('primary routes keep bottom content clear of fixed navigation', async ({ page }) => {
    test.setTimeout(60_000);
    const stackHref = await createStack(page);
    const routes = ['/', '/stacks', stackHref, '/labs', '/log', '/more', '/more/settings', '/more/ai-assistant', '/library'];

    for (const route of routes) {
      await page.goto(route);
      await acceptDisclaimer(page);
      await expectNoBottomNavOverlap(page);
    }
  });
});
