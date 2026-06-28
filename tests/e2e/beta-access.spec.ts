import { expect, test } from '@playwright/test';

test.describe('beta access gate', () => {
  test('renders standalone beta form and enables submit after email and key entry', async ({ page }) => {
    await page.goto('/beta');

    await expect(page.getByRole('heading', { name: 'Enter beta access.' })).toBeVisible();
    await expect(page.getByText('Private beta')).toBeVisible();

    const submit = page.getByRole('button', { name: /Enter PeptideOS/ });
    await expect(submit).toBeDisabled();

    await page.getByLabel('Email').fill('tester@example.com');
    await page.getByLabel('Beta key').fill('POS-TEST-KEY');

    await expect(submit).toBeEnabled();
  });
});
