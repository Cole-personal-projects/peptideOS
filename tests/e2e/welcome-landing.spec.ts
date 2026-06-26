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
    await page.goto('/welcome');
    await expect(page.getByLabel('Animated protocol cockpit preview')).toBeVisible();

    await expect
      .poll(async () => {
        return page.evaluate(() => {
          const hero = document.querySelector('[aria-label="Animated protocol cockpit preview"]');
          const rect = hero?.getBoundingClientRect();
          const pageOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;
          const heroOverflow = rect ? rect.left < -1 || rect.right > window.innerWidth + 1 : true;
          return pageOverflow || heroOverflow;
        });
      })
      .toBe(false);
  });
});
