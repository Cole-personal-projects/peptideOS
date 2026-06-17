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
    await expect(page.getByRole('textbox', { name: 'Sign-in code' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Verify sign-in code' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Research Purposes Only' })).toHaveCount(0);
  });

  test('anchors settings content in a stable readable column on full-screen iPad', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 1366 });
    await page.goto('/more/settings');

    await page.getByRole('button', { name: 'I Understand' }).click();

    const settingsContent = page.getByTestId('settings-content');
    await expect(settingsContent).toBeVisible();

    const box = await settingsContent.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(768);
    expect(box?.x).toBeGreaterThan(120);
  });
});
