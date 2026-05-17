import { expect, test } from '@playwright/test';

test.describe('site map body picker', () => {
  test('supports route, view, sex, and site selection controls', async ({ page }) => {
    await page.goto('/log/site-map');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Site Map' })).toBeVisible();
    await expect(page.locator('[data-body-map-ready="true"]')).toBeVisible();
    await expect(page.getByRole('img', { name: 'male front injection site map' })).toBeVisible();

    await page.getByRole('button', { name: 'Upper Left Abdomen' }).click();
    await expect(page.getByRole('status', { name: 'Selected site summary' })).toContainText('Upper Left Abdomen');

    await page.getByRole('button', { name: 'Show back view' }).click();
    await expect(page.getByRole('img', { name: 'male back injection site map' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Left Lower Back' })).toBeVisible();

    await page.getByRole('button', { name: 'Toggle body template' }).click();
    await expect(page.getByRole('img', { name: 'female back injection site map' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Left Lower Back' })).toBeVisible();

    await page.getByRole('tab', { name: 'IM' }).click();
    await expect(page.getByRole('button', { name: 'Left Lower Back' })).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('button', { name: 'Left Upper Outer Glute' })).toBeVisible();
  });
});
