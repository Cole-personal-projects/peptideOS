import { expect, test } from '@playwright/test';

test.describe('inventory metrics', () => {
  test('shows remaining amount and expiration metrics on inventory cards', async ({ page }) => {
    await page.goto('/more/inventory');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();

    const hghCard = page.locator('a[href="/more/inventory/vial-7"]');
    await expect(hghCard).toContainText('hGH (Somatropin)');
    await expect(hghCard).toContainText('Remaining');
    await expect(hghCard).toContainText('9.99 IU');
    await expect(hghCard).toContainText('Expiration');
    await expect(hghCard).toContainText(/2[67] days left/);

    const bpcCard = page.locator('a[href="/more/inventory/vial-1"]');
    await expect(bpcCard).toContainText('Remaining');
    await expect(bpcCard).toContainText('0 mg');
    await expect(bpcCard).toContainText('Source');
    await expect(bpcCard).not.toContainText('Vendor');
  });
});
