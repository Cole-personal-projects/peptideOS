import { expect, test } from '@playwright/test';

test.describe('beta access gate', () => {
  test('renders beta profile form and enables submit after email and key entry', async ({ page }) => {
    await page.goto('/beta');

    await expect(page.getByRole('heading', { name: 'Help shape the protocol cockpit.' })).toBeVisible();
    await expect(page.getByText('Private beta')).toBeVisible();
    await expect(page.getByText('Tell us what to watch.')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Labs' })).toHaveAttribute('aria-pressed', 'false');
    await page.getByRole('button', { name: 'Labs' }).click();
    await expect(page.getByRole('button', { name: 'Labs' })).toHaveAttribute('aria-pressed', 'true');

    const submit = page.getByRole('button', { name: /Enter PeptideOS/ });
    await expect(submit).toBeDisabled();

    await page.getByLabel('Email').fill('tester@example.com');
    await page.getByLabel('Beta key').fill('POS-TEST-KEY');
    await expect(submit).toBeEnabled();
  });
});
