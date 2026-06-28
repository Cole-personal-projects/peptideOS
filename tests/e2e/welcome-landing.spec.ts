import { expect, test } from '@playwright/test';

test.describe('welcome landing page', () => {
  test('renders the PeptideOS landing page with PWA install guidance', async ({ page }) => {
    await page.goto('/welcome');

    await expect(page.getByRole('heading', { name: 'PeptideOS' })).toBeVisible();
    await expect(page.getByText('A private protocol cockpit for doses, inventory, labs, and estimated remaining amount.')).toBeVisible();
    await expect(page.getByLabel('Animated protocol cockpit preview')).toBeVisible();
    await expect(page.getByRole('button', { name: /Start local setup|Open PeptideOS/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Install on device' })).toBeVisible();

    await page.getByRole('link', { name: 'Install on device' }).click();
    await expect(page.getByRole('heading', { name: 'Add it to your phone like an app.' })).toBeVisible();
    await expect(page.getByText('Open in Safari and tap Share.')).toBeVisible();
    await expect(page.getByText('Use the install prompt or menu.')).toBeVisible();
  });

  test('starts the existing onboarding flow from the primary CTA', async ({ page }) => {
    await page.goto('/welcome');

    await page.getByRole('button', { name: 'Start local setup' }).click();

    await expect(page.getByRole('button', { name: 'I Understand' })).toBeVisible();
  });

  test('keeps the landing hero inside the mobile viewport', async ({ page }) => {
    await page.goto('/welcome', { waitUntil: 'networkidle' });
    const hero = page.getByLabel('Animated protocol cockpit preview');
    await expect(hero).toBeVisible();

    await expect
      .poll(async () => {
        const box = await hero.boundingBox();
        const viewport = page.viewportSize();
        const pageOverflow = await page.locator('html').evaluate((element) => element.scrollWidth > window.innerWidth + 1);
        const heroOverflow = box && viewport ? box.x < -1 || box.x + box.width > viewport.width + 1 : true;
        return pageOverflow || heroOverflow;
      })
      .toBe(false);
  });
});
