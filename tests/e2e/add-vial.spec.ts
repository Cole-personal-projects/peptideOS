import { expect, test } from '@playwright/test';

test.describe('add vial', () => {
  test('creates a named sealed vial and shows its date added on details', async ({ page }) => {
    await page.goto('/more/inventory');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();

    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('dialog', { name: 'Add vial' })).toBeVisible();

    await page.getByRole('textbox', { name: 'Vial name' }).fill('Travel GHK-Cu');
    await page.getByLabel('Peptide').selectOption('ghk-cu');
    await page.getByLabel('Date added').fill('2026-05-20');
    await page.getByRole('button', { name: 'Create vial' }).click();

    await page.getByRole('tab', { name: /Sealed/ }).click();
    const newVialCard = page.getByRole('link', { name: /Travel GHK-Cu/ });
    await expect(newVialCard).toBeVisible();
    await expect(newVialCard).toContainText('Added May 20, 2026');

    await newVialCard.click();
    await expect(page.getByRole('heading', { name: 'Travel GHK-Cu' })).toBeVisible();
    await expect(page.getByText('Date Added')).toBeVisible();
    await expect(page.getByText('May 20, 2026')).toBeVisible();
    await expect(page.getByText('GHK-Cu', { exact: true })).toBeVisible();
  });
});
