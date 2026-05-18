import { expect, test } from '@playwright/test';

test.describe('log dose sheet body picker', () => {
  test('supports compact body-map site selection and route filtering', async ({ page }) => {
    await page.goto('/stacks');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Quick actions' }).click();
    await page.getByRole('button', { name: 'Log Dose' }).click();

    await expect(page.getByRole('heading', { name: 'Log Dose' })).toBeVisible();
    await expect(page.locator('[data-body-map-ready="true"]')).toBeVisible();
    await expect(page.getByRole('img', { name: 'male front injection site map' })).toBeVisible();

    await page.getByRole('button', { name: 'Upper Left Abdomen' }).click();
    await expect(page.getByRole('status', { name: 'Selected site summary' })).toContainText('Upper Left Abdomen');

    await page.getByRole('tab', { name: 'IM' }).click();
    await expect(page.getByRole('button', { name: 'Upper Left Abdomen' })).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('button', { name: 'Left Anterior Deltoid' })).toBeVisible();
  });

  test('applies compound-aware dose preset chips without changing units', async ({ page }) => {
    await page.goto('/stacks');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Quick actions' }).click();
    await page.getByRole('button', { name: 'Log Dose' }).click();

    await page.getByRole('combobox').filter({ hasText: 'Select peptide' }).click();
    await page.getByRole('option', { name: 'TB-500' }).click();

    await page.getByRole('button', { name: 'TB-500 2mg' }).click();
    await expect(page.getByPlaceholder('e.g., 250')).toHaveValue('2');
    await expect(page.getByRole('combobox').filter({ hasText: 'mg' })).toBeVisible();
  });
});
