import { expect, test } from '@playwright/test';

test.describe('account settings', () => {
  test('keeps signed-out users in local-only mode with account controls visible', async ({ page }) => {
    await page.goto('/more/settings');

    await page.getByRole('button', { name: 'I Understand' }).click();

    await expect(page.getByText('Account', { exact: true })).toBeVisible();
    await expect(page.getByText('Local-only mode')).toBeVisible();
    await expect(page.getByText('Your data remains on this device until you sign in and cloud sync is available.')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send sign-in link' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Research Purposes Only' })).toHaveCount(0);
  });
});
