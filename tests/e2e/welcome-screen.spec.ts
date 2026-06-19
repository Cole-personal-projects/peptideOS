import { expect, test } from '@playwright/test';

test.describe('welcome screen', () => {
  test('greets first-run users before onboarding starts', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'PeptideOS' })).toBeVisible();
    await expect(page.getByText('Your peptide research operating system.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByText('For research tracking only. Not medical advice.')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toHaveCount(0);

    await page.getByRole('button', { name: 'Get started' }).click();

    await expect(page.getByRole('alertdialog', { name: 'Research Purposes Only' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'I Understand' })).toBeVisible();
  });

  test('skips the root welcome screen after onboarding is complete', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toBeVisible();

    await page.reload();

    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toBeVisible();
    await expect(page.getByText('Your peptide research operating system.')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Get started' })).toHaveCount(0);
  });

  test('lets first-run users open sign-in controls from the welcome screen', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/more\/settings\?entry=signin$/);
    await expect(page.getByRole('alertdialog', { name: 'Research Purposes Only' })).toHaveCount(0);
    await expect(page.getByText('Account', { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send sign-in link' })).toBeVisible();
  });

  test('starts onboarding from the dedicated welcome route for new users', async ({ page }) => {
    await page.goto('/welcome');

    await page.getByRole('button', { name: 'Get started' }).click();

    await expect(page.getByRole('alertdialog', { name: 'Research Purposes Only' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'I Understand' })).toBeVisible();
  });
});
