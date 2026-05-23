import { expect, test } from '@playwright/test';

test.describe('local persistence', () => {
  test('persists onboarding completion across reloads', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toBeVisible();

    await page.reload();

    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Research Purposes Only' })).toHaveCount(0);
  });

  test('persists added vials across reloads', async ({ page }) => {
    await page.goto('/more/inventory');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('textbox', { name: 'Vial name' }).fill('Reload Persisted GHK-Cu');
    await page.getByLabel('Peptide').selectOption('ghk-cu');
    await page.getByLabel('Date added').fill('2026-05-21');
    await page.getByRole('button', { name: 'Create vial' }).click();

    await page.getByRole('tab', { name: /Sealed/ }).click();
    await expect(page.getByRole('link', { name: /Reload Persisted GHK-Cu/ })).toBeVisible();

    await page.reload();
    await page.getByRole('tab', { name: /Sealed/ }).click();

    await expect(page.getByRole('link', { name: /Reload Persisted GHK-Cu/ })).toBeVisible();
  });

  test('clears local data from Settings and returns to first-run state', async ({ page }) => {
    await page.goto('/more/inventory');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('textbox', { name: 'Vial name' }).fill('Clear Data GHK-Cu');
    await page.getByLabel('Peptide').selectOption('ghk-cu');
    await page.getByLabel('Date added').fill('2026-05-21');
    await page.getByRole('button', { name: 'Create vial' }).click();
    await page.getByRole('tab', { name: /Sealed/ }).click();
    await expect(page.getByRole('link', { name: /Clear Data GHK-Cu/ })).toBeVisible();

    await page.goto('/more/settings');
    await page.getByRole('button', { name: 'Clear All Data' }).click();
    await expect(page.getByRole('heading', { name: 'Research Purposes Only' })).toBeVisible();
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Research Purposes Only' })).toBeVisible();
    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Research Purposes Only' })).toHaveCount(0);
    await page.goto('/more/inventory');
    await page.getByRole('tab', { name: /Sealed/ }).click();

    await expect(page.getByRole('link', { name: /Clear Data GHK-Cu/ })).toHaveCount(0);
  });
});
