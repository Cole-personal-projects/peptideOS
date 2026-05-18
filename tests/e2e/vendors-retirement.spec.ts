import { expect, test } from '@playwright/test';

test.describe('retired vendors feature', () => {
  test('removes vendor navigation while preserving inventory source metadata', async ({ page }) => {
    await page.goto('/more');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'More' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Vendors/ })).toHaveCount(0);

    await page.getByRole('link', { name: /Inventory/ }).click();
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();
    await expect(page.getByText('Source').first()).toBeVisible();
    await expect(page.getByText('Vendor').first()).toHaveCount(0);
  });

  test('does not serve the retired vendors route', async ({ page }) => {
    await page.goto('/more/vendors');

    await expect(page.getByRole('heading', { name: 'Vendors' })).toHaveCount(0);
    await expect(page.getByText('This page could not be found.')).toBeVisible();
  });
});
