import { expect, test } from '@playwright/test';

test.describe('compound-aware inventory intake', () => {
  test('prefills library compound vial details and saves kits as grouped inventory', async ({ page }) => {
    await page.goto('/library/bpc-157');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('link', { name: 'Add BPC-157 to inventory' }).click();

    await expect(page).toHaveURL(/\/more\/inventory\?compound=bpc-157&add=inventory/);
    await expect(page.getByRole('dialog', { name: 'Add Vial' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Compound' })).toHaveText('BPC-157');
    await expect(page.getByRole('textbox', { name: 'Vial name' })).toHaveValue('BPC-157 inventory');
    await expect(page.getByRole('spinbutton', { name: 'Vial size' })).toHaveValue('5');
    await expect(page.getByRole('combobox', { name: 'Vial size unit' })).toHaveText('mg');

    await page.getByRole('combobox', { name: 'Inventory unit' }).click();
    await page.getByRole('option', { name: 'Kits (10 vials)' }).click();
    await page.getByRole('button', { name: 'Add Vial' }).click();

    await expect(page.getByRole('dialog', { name: 'Add Vial' })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: /Sealed/ })).toContainText('10');

    const groupedCard = page.getByRole('link', { name: /BPC-157 inventory/ });
    await expect(groupedCard).toBeVisible();
    await expect(groupedCard).toContainText('1 kit / 10 vials');
    await expect(groupedCard).toContainText('5 mg each');

    await page.reload();
    await page.getByRole('tab', { name: /Sealed/ }).click();
    const persistedGroupedCard = page.getByRole('link', { name: /BPC-157 inventory/ });
    await expect(persistedGroupedCard).toBeVisible();
    await expect(persistedGroupedCard).toContainText('1 kit / 10 vials');
    await expect(persistedGroupedCard).toContainText('5 mg each');
  });
});
