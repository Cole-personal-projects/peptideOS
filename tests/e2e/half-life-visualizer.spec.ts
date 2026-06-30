import { expect, test } from '@playwright/test';

test.describe('half-life visualizer', () => {
  test('models a source-backed compound before protocol logging', async ({ page }) => {
    await page.goto('/more/half-life');
    await page.getByRole('button', { name: 'I Understand' }).click();

    await expect(page.getByRole('heading', { name: 'Half-Life' })).toBeVisible();
    await expect(page.getByText('Model a curve before you log.')).toBeVisible();
    await expect(page.getByRole('img', { name: /estimated remaining amount curve/i })).toBeVisible();
    await expect(page.getByLabel('Compound picker')).toBeVisible();

    await page.getByLabel('Search compounds').fill('tirz');
    await page.getByRole('button', { name: /Tirzepatide/ }).click();
    await page.getByLabel('Dose amount').fill('2.5');
    await page.getByLabel('Doses to model').fill('20');
    await page.getByRole('button', { name: 'Every 2d' }).click();
    await page.getByRole('button', { name: '30d' }).click();

    await expect(page.getByRole('heading', { name: 'Tirzepatide' })).toBeVisible();
    await expect(page.getByText('16 doses')).toBeVisible();
    await expect(page.getByText('Estimated remaining amount · 30 days')).toBeVisible();

    await page.getByLabel('Compound picker').click();
    await page.getByRole('option', { name: /hGH|Somatropin/ }).click();
    await page.getByLabel('Dose unit').click();
    await expect(page.getByRole('option', { name: 'IU' })).toBeVisible();
  });
});
