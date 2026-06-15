import { expect, test } from '@playwright/test';

test.describe('signals', () => {
  test('creates a signal check-in and persists it across reloads', async ({ page }) => {
    await page.goto('/more');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('link', { name: /Signals/ }).click();
    await expect(page.getByRole('heading', { name: 'Signals' })).toBeVisible();
    await expect(page.getByText('No signal check-ins yet')).toBeVisible();

    await page.getByRole('button', { name: 'Add Signal' }).click();
    await page.getByRole('spinbutton', { name: 'Energy' }).fill('7');
    await page.getByRole('spinbutton', { name: 'Sleep' }).fill('6');
    await page.getByRole('textbox', { name: 'Notes' }).fill('Shoulder calm after protocol day.');
    await page.getByRole('button', { name: 'Save Signal' }).click();

    await expect(page.getByText('Energy 7/10')).toBeVisible();
    await expect(page.getByText('Sleep 6 hr')).toBeVisible();
    await expect(page.getByText('Shoulder calm after protocol day.')).toBeVisible();

    await page.reload();

    await expect(page.getByText('Energy 7/10')).toBeVisible();
    await expect(page.getByText('Sleep 6 hr')).toBeVisible();
    await expect(page.getByText('Shoulder calm after protocol day.')).toBeVisible();
  });
});
