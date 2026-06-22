import { expect, test } from '@playwright/test';

async function importQuestHormones(page: import('@playwright/test').Page, drawDate: string) {
  await page.getByRole('button', { name: 'Import' }).click();
  await page.getByRole('button', { name: 'CSV / Spreadsheet' }).click();
  await page.getByRole('button', { name: 'Quest hormones' }).click();
  await page.getByLabel('Draw date').fill(drawDate);
  await page.getByRole('button', { name: 'Review Data' }).click();
  await expect(page.getByLabel('Test name 1')).toHaveValue('Estradiol Sensitive');
  await expect(page.getByLabel('Assay method 1')).toHaveValue('LC/MS/MS');
  await page.getByRole('button', { name: 'Confirm Import' }).click();
  await expect(page.getByText('Import complete')).toBeVisible();
  await page.getByRole('button', { name: 'View Timeline' }).click();
}

test.describe('lab results workspace', () => {
  test('imports labs and exposes timeline, detail, compare, trends, and redirect flows', async ({ page }) => {
    await page.goto('/more/lab-results');
    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page).toHaveURL(/\/labs/);
    await expect(page.getByRole('heading', { name: 'Lab Results' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Labs/ })).toHaveClass(/text-primary/);

    await expect(page.getByText('No lab results yet')).toBeVisible();
    await page.getByRole('button', { name: 'Import Lab Results' }).click();
    await expect(page.getByText('Step 1 of 4')).toBeVisible();
    await page.getByRole('button', { name: 'Upload PDF' }).click();
    await expect(page.getByText('OCR/AI extraction is coming later')).toBeVisible();
    await page.getByRole('button', { name: 'CSV/text' }).click();
    await page.getByRole('button', { name: 'Quest hormones' }).click();
    await page.getByLabel('Draw date').fill('2026-06-01');
    await page.getByRole('button', { name: 'Review Data' }).click();
    await expect(page.getByLabel('Test name 1')).toHaveValue('Estradiol Sensitive');
    await expect(page.getByLabel('Assay method 1')).toHaveValue('LC/MS/MS');
    await page.getByRole('button', { name: 'Confirm Import' }).click();
    await expect(page.getByText('Import complete')).toBeVisible();
    await page.getByRole('button', { name: 'View Timeline' }).click();

    await expect(page.getByText(/Jun 1, 2026 · Hormones/)).toBeVisible();
    await expect(page.getByText('Baseline')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Analyze' }).first()).toBeVisible();
    await page.getByRole('link', { name: /Estradiol Sensitive/ }).click();
    await expect(page).toHaveURL(/view=detail/);
    await expect(page.getByText('Active stack during test')).toBeVisible();
    await expect(page.getByText(/Assay or unit changed.*Compare cautiously/)).toBeVisible();

    await page.getByRole('button', { name: 'Compare Tests' }).click();
    await expect(page.getByLabel('Test 1')).toBeVisible();
    await expect(page.getByText('Estradiol Sensitive', { exact: true }).first()).toBeVisible();

    await importQuestHormones(page, '2026-07-01');
    await page.getByRole('button', { name: 'Compare' }).first().click();
    await expect(page).toHaveURL(/view=compare/);
    await expect(page.getByText('Testosterone Total', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/0%|\+/).first()).toBeVisible();

    await page.getByRole('button', { name: 'Trends' }).click();
    await expect(page.getByText('Key marker trends')).toBeVisible();
    await expect(page.getByText(/Assay or unit changed.*Compare cautiously/)).toBeVisible();
    await expect(page.getByText(/Not enough data|strong|moderate|weak/).first()).toBeVisible();
  });
});
