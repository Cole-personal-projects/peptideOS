import { expect, test } from '@playwright/test';

test.describe('lab results', () => {
  test('imports structured lab results and shows assay-aware trends', async ({ page }) => {
    await page.goto('/more/lab-results');
    await page.getByRole('button', { name: 'I Understand' }).click();

    await expect(page.getByRole('heading', { name: 'Lab Results' })).toBeVisible();
    await page.getByLabel('Draw date').fill('2026-06-01');
    await page.getByLabel('Source label').fill('Quest');
    await page.getByLabel('Panel').fill('Hormones');
    await page.getByPlaceholder(/Test,Value,Unit/).fill([
      'Test,Value,Unit,Reference Range,Flag,Assay',
      'Estradiol Sensitive,22,pg/mL,8-35,normal,LC/MS/MS',
      'Estradiol,31,pg/mL,8-35,normal,Immunoassay',
    ].join('\n'));

    await page.getByRole('button', { name: 'Review import' }).click();
    await expect(page.getByText('Estradiol Sensitive', { exact: true })).toBeVisible();
    await expect(page.getByText(/LC\/MS\/MS/).first()).toBeVisible();
    await page.getByRole('button', { name: 'Save labs' }).click();

    await expect(page.getByText(/2026 · Hormones/)).toBeVisible();
    await expect(page.getByText(/Assay.*unit changed.*Compare cautiously/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Analyze' })).toBeVisible();
  });
});
