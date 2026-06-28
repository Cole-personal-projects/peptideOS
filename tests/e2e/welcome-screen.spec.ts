import { expect, test } from '@playwright/test';

test.describe('welcome screen', () => {
  test('greets first-run users on dedicated welcome route', async ({ page }) => {
    await page.goto('/welcome');

    await expect(page.getByRole('heading', { name: 'PeptideOS' })).toBeVisible();
    await expect(page.getByText('A private protocol cockpit')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start local setup' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
await expect(page.getByLabel('Animated protocol cockpit preview')).toHaveCount(1);
await expect(page.getByText('No dose advice')).toBeVisible();
await expect(page.getByText('2026 MonkeyShines - Beta v0.4 - Initial release target v1.0')).toBeVisible();
await expect(page.getByText('Protocol score')).toHaveCount(0);

    await page.getByRole('button', { name: 'Start local setup' }).click();

    await expect(page.getByRole('alertdialog', { name: 'Research Purposes Only' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'I Understand' })).toBeVisible();
  });

  test('keeps root as dashboard after onboarding is complete', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'PeptideOS' })).toBeVisible();

    await page.reload();

    await expect(page.getByRole('heading', { name: 'PeptideOS' })).toBeVisible();
    await expect(page.getByText('A private protocol cockpit')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Start local setup' })).toHaveCount(0);
  });

  test('lets first-run users open sign-in controls from welcome screen', async ({ page }) => {
    await page.goto('/welcome');

    await page.getByRole('link', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/more\/settings\?entry=signin$/);
    await expect(page.getByRole('alertdialog', { name: 'Research Purposes Only' })).toHaveCount(0);
    await expect(page.getByText('Account', { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send sign-in link' })).toBeVisible();
  });

  test('starts onboarding from dedicated welcome route for new users', async ({ page }) => {
    await page.goto('/welcome');

    await page.getByRole('button', { name: 'Start local setup' }).click();

    await expect(page.getByRole('alertdialog', { name: 'Research Purposes Only' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'I Understand' })).toBeVisible();
  });
});
