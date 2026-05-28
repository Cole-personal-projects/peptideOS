import { expect, test } from '@playwright/test';
import { formatCompoundDisplayLabel } from '../../lib/compound-display';
import { referenceCompounds } from '../../lib/reference-compounds';

test.describe('library filters', () => {
  test('renders every bundled reference category as a visible filter', async ({ page }) => {
    const categories = [...new Set(referenceCompounds.map((compound) => compound.category))];

    await page.goto('/library');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();

    for (const category of categories) {
      await expect(page.getByRole('button', { name: formatCompoundDisplayLabel(category) })).toBeVisible();
    }
  });

  test('filters library cards by search text and category without leaving the page', async ({ page }) => {
    await page.goto('/library');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();

    await page.getByRole('searchbox', { name: 'Search compounds' }).fill('testosterone');
    await expect(page.getByRole('link', { name: /Testosterone Cypionate/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /BPC-157/ })).toHaveCount(0);

    await page.getByRole('button', { name: 'Healing' }).click();
    await expect(page.getByText('No matching peptides')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible();

    await page.getByRole('button', { name: 'All categories' }).click();
    await page.getByRole('searchbox', { name: 'Search compounds' }).fill('nitric oxide');
    await expect(page.getByRole('link', { name: /BPC-157/ })).toBeVisible();

    await page.getByRole('link', { name: /BPC-157/ }).click();
    await expect(page).toHaveURL(/\/library\/bpc-157$/);
  });

  test('exposes reviewed batch one entries through search and category filters', async ({ page }) => {
    await page.goto('/library');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('searchbox', { name: 'Search compounds' }).fill('tirzepatide');
    await expect(page.getByRole('link', { name: /Tirzepatide/ })).toBeVisible();

    await page.getByRole('searchbox', { name: 'Search compounds' }).fill('');
    await page.getByRole('button', { name: 'Sexual Reproductive' }).click();
    await expect(page.getByRole('link', { name: /PT-141 \/ Bremelanotide/ })).toBeVisible();
    await page.getByRole('link', { name: /PT-141 \/ Bremelanotide/ }).click();
    await expect(page).toHaveURL(/\/library\/bremelanotide$/);
  });

  test('exposes reviewed batch two entries through search and immune category filters', async ({ page }) => {
    await page.goto('/library');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('searchbox', { name: 'Search compounds' }).fill('MOTS-c');
    await expect(page.getByRole('link', { name: /MOTS-c/ })).toBeVisible();

    await page.getByRole('searchbox', { name: 'Search compounds' }).fill('');
    await page.getByRole('button', { name: 'Immune' }).click();
    await expect(page.getByRole('link', { name: /LL-37/ })).toBeVisible();
    await page.getByRole('link', { name: /LL-37/ }).click();
    await expect(page).toHaveURL(/\/library\/ll-37$/);
  });

  test('exposes reviewed batch three entries through search and category filters', async ({ page }) => {
    await page.goto('/library');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('searchbox', { name: 'Search compounds' }).fill('Dihexa');
    await expect(page.getByRole('link', { name: /Dihexa/ })).toBeVisible();

    await page.getByRole('searchbox', { name: 'Search compounds' }).fill('');
    await page.getByRole('button', { name: 'Skin Hair' }).click();
    await expect(page.getByRole('link', { name: /AHK-Cu/ })).toBeVisible();
    await page.getByRole('link', { name: /AHK-Cu/ }).click();
    await expect(page).toHaveURL(/\/library\/ahk-cu$/);
  });

  test('exposes reviewed batch four entries through search and sleep category filters', async ({ page }) => {
    await page.goto('/library');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('searchbox', { name: 'Search compounds' }).fill('Elamipretide');
    await expect(page.getByRole('link', { name: /Elamipretide/ })).toBeVisible();

    await page.getByRole('searchbox', { name: 'Search compounds' }).fill('');
    await page.getByRole('button', { name: 'Sleep' }).click();
    await expect(page.getByRole('link', { name: /DSIP/ })).toBeVisible();
    await page.getByRole('link', { name: /DSIP/ }).click();
    await expect(page).toHaveURL(/\/library\/dsip$/);
  });
});
