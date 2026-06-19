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

  test('opens grouped kit inventory as a batch detail instead of a single vial page', async ({ page }) => {
    await page.goto('/library/bpc-157');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('link', { name: 'Add BPC-157 to inventory' }).click();
    await page.getByRole('combobox', { name: 'Inventory unit' }).click();
    await page.getByRole('option', { name: 'Kits (10 vials)' }).click();
    await page.getByRole('button', { name: 'Add Vial' }).click();

    await page.getByRole('link', { name: /BPC-157 inventory/ }).click();

    await expect(page.getByRole('heading', { name: 'BPC-157 inventory' })).toBeVisible();
    await expect(page.getByText('1 kit / 10 vials')).toBeVisible();
    await expect(page.getByText('5 mg each')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Vials in batch' })).toBeVisible();
    await expect(page.getByText('Vial 1 of 10', { exact: true })).toBeVisible();
    await expect(page.getByText('Vial 10 of 10', { exact: true })).toBeVisible();
  });

  test('edits grouped kit metadata once across every vial in the batch', async ({ page }) => {
    await page.goto('/library/bpc-157');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('link', { name: 'Add BPC-157 to inventory' }).click();
    await page.getByRole('combobox', { name: 'Inventory unit' }).click();
    await page.getByRole('option', { name: 'Kits (10 vials)' }).click();
    await page.getByRole('button', { name: 'Add Vial' }).click();
    await page.getByRole('link', { name: /BPC-157 inventory/ }).click();

    await page.getByRole('button', { name: 'Edit batch' }).click();
    await expect(page.getByRole('dialog', { name: 'Edit batch' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Batch name' }).fill('Edited BPC batch');
    await page.getByRole('spinbutton', { name: 'Vial size' }).fill('6');
    await page.getByRole('textbox', { name: 'Source' }).fill('Updated lab');
    await page.getByRole('textbox', { name: 'Lot Number' }).fill('BPC-BATCH-001');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByRole('heading', { name: 'Edited BPC batch' })).toBeVisible();
    await expect(page.getByText('6 mg each')).toBeVisible();
    await expect(page.getByText('Updated lab', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('BPC-BATCH-001', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Vial 1 of 10', { exact: true }).locator('..')).toContainText('6 mg · Updated lab · BPC-BATCH-001');
    await expect(page.getByText('Vial 10 of 10', { exact: true }).locator('..')).toContainText('6 mg · Updated lab · BPC-BATCH-001');
  });

  test('deletes a grouped kit batch and persists removal after reload', async ({ page }) => {
    await page.goto('/library/bpc-157');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('link', { name: 'Add BPC-157 to inventory' }).click();
    await page.getByRole('combobox', { name: 'Inventory unit' }).click();
    await page.getByRole('option', { name: 'Kits (10 vials)' }).click();
    await page.getByRole('button', { name: 'Add Vial' }).click();
    await page.getByRole('link', { name: /BPC-157 inventory/ }).click();

    await page.getByRole('button', { name: 'Delete batch' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Delete inventory batch?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Delete batch' }).click();

    await expect(page).toHaveURL(/\/more\/inventory$/);
    await page.getByRole('tab', { name: /Sealed/ }).click();
    await expect(page.getByRole('link', { name: /BPC-157 inventory/ })).toHaveCount(0);
    await expect(page.getByText('No sealed vials')).toBeVisible();

    await page.reload();
    await page.getByRole('tab', { name: /Sealed/ }).click();
    await expect(page.getByRole('link', { name: /BPC-157 inventory/ })).toHaveCount(0);
    await expect(page.getByText('No sealed vials')).toBeVisible();
  });
});
