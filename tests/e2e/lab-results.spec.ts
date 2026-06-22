import { expect, test } from '@playwright/test';

test.describe('lab results', () => {
  test('imports structured lab results and shows editable assay-aware trends', async ({ page }) => {
    await page.goto('/more/lab-results');
    await page.getByRole('button', { name: 'I Understand' }).click();

    await expect(page.getByRole('heading', { name: 'Lab Results' })).toBeVisible();
    await page.getByRole('button', { name: 'Quest hormones' }).click();
    await page.getByLabel('Draw date').fill('2026-06-01');
    await page.getByRole('button', { name: 'Review import' }).click();

    await expect(page.getByLabel('Test name 1')).toHaveValue('Estradiol Sensitive');
    await expect(page.getByLabel('Assay method 1')).toHaveValue('LC/MS/MS');
    await page.getByLabel('Test name 1').fill('Estradiol Sensitive LC/MS/MS');
    await page.getByRole('button', { name: 'Save labs' }).click();

    await expect(page.getByText(/2026 · Hormones/)).toBeVisible();
    await expect(page.getByText('Protocol context')).toBeVisible();
    await expect(page.getByText('No active protocol on draw date')).toBeVisible();
    await expect(page.getByText(/Assay.*unit changed.*Compare cautiously/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Analyze' }).first()).toBeVisible();
  });
});
