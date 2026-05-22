import { expect, test } from '@playwright/test';

test.describe('library filters', () => {
  test('filters library cards by search text and category without leaving the page', async ({ page }) => {
    await page.goto('/library');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();

    await page.getByRole('searchbox', { name: 'Search peptides' }).fill('GLP-1');
    await expect(page.getByRole('link', { name: /Semaglutide/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /BPC-157/ })).toHaveCount(0);

    await page.getByRole('button', { name: 'Healing' }).click();
    await expect(page.getByText('No matching peptides')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible();

    await page.getByRole('button', { name: 'All' }).click();
    await page.getByRole('searchbox', { name: 'Search peptides' }).fill('nitric oxide');
    await expect(page.getByRole('link', { name: /BPC-157/ })).toBeVisible();

    await page.getByRole('link', { name: /BPC-157/ }).click();
    await expect(page).toHaveURL(/\/library\/bpc-157$/);
  });
});
