import { expect, test } from '@playwright/test';

test.describe('half-life visualizer', () => {
  test('models a source-backed compound before protocol logging', async ({ page }) => {
    await page.goto('/more/half-life');
    await page.getByRole('button', { name: 'I Understand' }).click();

    await expect(page.getByRole('heading', { name: 'Half-Life' })).toBeVisible();
    await expect(page.getByText('Model a curve before you log.')).toBeVisible();
    await expect(page.getByRole('img', { name: /estimated remaining amount curve/i })).toBeVisible();

    await page.getByLabel('Compound').fill('tirz');
    await page.getByRole('button', { name: /Tirzepatide/ }).click();
    await page.getByLabel('Dose').fill('2.5');
    await page.getByRole('button', { name: 'Every 2d' }).click();
    await page.getByRole('button', { name: '8' }).click();
    await page.getByRole('button', { name: '30d' }).click();

    await expect(page.getByRole('heading', { name: 'Tirzepatide' })).toBeVisible();
    await expect(page.getByText('8 doses')).toBeVisible();
    await expect(page.getByText('Estimated remaining amount · 30 days')).toBeVisible();
  });
});
