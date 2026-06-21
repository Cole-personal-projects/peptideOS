import { expect, test, type Page } from '@playwright/test';
import { formatCompoundDisplayLabel } from '../../lib/compound-display';
import { referenceCompounds } from '../../lib/reference-compounds';

async function chooseLibraryFilter(page: Page, name: string) {
  await page.getByRole('button', { name: /^Filters(?: \d+)?$/ }).click();
  const drawer = page.getByRole('dialog', { name: 'Filters' });
  await drawer.getByRole('button', { name }).click();
  await drawer.getByRole('button', { name: /Show \d+ compounds/ }).click();
}

test.describe('library filters', () => {
  test('keeps filters behind one drawer with active chips and obvious reset', async ({ page }) => {
    const categories = [...new Set(referenceCompounds.map((compound) => compound.category))];

    await page.goto('/library');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();
    await expect(page.getByLabel('Filter by compound type')).toHaveCount(0);
    await expect(page.getByLabel('Filter by category')).toHaveCount(0);
    await expect(page.getByLabel('Filter by evidence')).toHaveCount(0);

    await page.getByRole('button', { name: 'Filters' }).click();
    await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible();
    for (const category of categories) {
      await expect(page.getByRole('button', { name: formatCompoundDisplayLabel(category) })).toBeVisible();
    }

    await page.getByRole('button', { name: 'Hormone Endocrine' }).click();
    await page.getByRole('button', { name: /Show \d+ compounds/ }).click();

    await expect(page.getByRole('button', { name: 'Filters 1' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hormone Endocrine, remove filter' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear all filters' })).toBeVisible();

    await page.getByRole('button', { name: 'Clear all filters' }).click();
    await expect(page.getByRole('button', { name: 'Filters' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hormone Endocrine, remove filter' })).toHaveCount(0);
  });

  test('filters library cards by search text and category without leaving the page', async ({ page }) => {
    await page.goto('/library');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();

    await page.getByRole('searchbox', { name: 'Search compounds' }).fill('testosterone');
    await expect(page.getByRole('link', { name: /Testosterone Cypionate/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /BPC-157/ })).toHaveCount(0);

    await chooseLibraryFilter(page, 'Healing');
    await expect(page.getByText('No matching peptides')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible();

    await chooseLibraryFilter(page, 'All categories');
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
    await chooseLibraryFilter(page, 'Sexual Reproductive');
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
    await chooseLibraryFilter(page, 'Immune');
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
    await chooseLibraryFilter(page, 'Skin Hair');
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
    await chooseLibraryFilter(page, 'Sleep');
    await expect(page.getByRole('link', { name: /DSIP/ })).toBeVisible();
    await page.getByRole('link', { name: /DSIP/ }).click();
    await expect(page).toHaveURL(/\/library\/dsip$/);
  });

  test('surfaces evidence tier and regulatory status filters without marking investigational compounds approved', async ({ page }) => {
    await page.goto('/library');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();

    const retatrutideCard = page.getByRole('link', { name: /Retatrutide/ });
    await expect(retatrutideCard).toBeVisible();
    await expect(retatrutideCard.getByText('Strong Human')).toBeVisible();
  await expect(retatrutideCard).toContainText('Investigational');
    await expect(retatrutideCard.getByText('GLP-1 / GIP / Glucagon')).toBeVisible();
    await expect(retatrutideCard.getByText('Approved')).toHaveCount(0);

    await chooseLibraryFilter(page, 'Strong Human');
    await expect(page.getByRole('link', { name: /Retatrutide/ })).toBeVisible();

    await chooseLibraryFilter(page, 'Approved Label');
    await expect(page.getByRole('link', { name: /Retatrutide/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Semaglutide/ })).toBeVisible();
  });

  test('hides the pro-data upgrade queue once all bundled profiles are complete', async ({ page }) => {
    await page.goto('/library');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();

    await expect(page.getByText('Pro data queue')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /hGH \/ Somatropin/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Tesamorelin/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Sermorelin/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Tirzepatide Pro data priority/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /BPC-157 Pro data priority/ })).toHaveCount(0);
    await expect(page.getByText('Retatrutide').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Retatrutide Pro data priority/ })).toHaveCount(0);
  });
});
