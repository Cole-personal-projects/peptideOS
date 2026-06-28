import { expect, test } from '@playwright/test';

test.describe('reconstitution compound picker', () => {
  test('searches and selects compounds from a scrollable alphabetical list', async ({ page }) => {
    await page.goto('/more/reconstitution');
    await page.getByRole('button', { name: 'I Understand' }).click();

    await expect(page.getByRole('heading', { name: 'Reconstitution Calculator' })).toBeVisible();
    await page.getByLabel('Search compounds').fill('hcg');

    const results = page.getByLabel('Compound results');
    await expect(results.getByRole('button', { name: /HCG/ })).toBeVisible();
    await expect(results.getByRole('button', { name: /BPC-157/ })).toHaveCount(0);

    await results.getByRole('button', { name: /HCG/ }).click();
    await expect(results.getByRole('button', { name: /HCG/ })).toHaveAttribute('aria-pressed', 'true');
  });
});
