import { expect, test } from '@playwright/test';

test.describe('first-launch onboarding', () => {
  test('supports setup mode selection and applies researcher defaults to library', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Research Purposes Only' })).toBeVisible();
    await page.getByRole('button', { name: 'Set up profile' }).click();

    await expect(page.getByRole('heading', { name: 'Choose content depth' })).toBeVisible();
    await page.getByRole('radio', { name: 'Researcher' }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByRole('heading', { name: 'Core workflows' })).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByRole('heading', { name: 'Ready to track' })).toBeVisible();
    await page.getByRole('button', { name: 'Enter PeptideOS' }).click();

    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Research Purposes Only' })).toHaveCount(0);

    await page.getByRole('link', { name: 'Library' }).click();
    await expect(page.getByText('Researcher Mode: Showing detailed information')).toBeVisible();
    await expect(page.getByText('Body Protection Compound-157 is a pentadecapeptide')).toBeVisible();

    await page.getByRole('link', { name: /BPC-157/ }).click();
    await expect(page.getByText('Body Protection Compound-157 is a pentadecapeptide')).toBeVisible();
  });
});
