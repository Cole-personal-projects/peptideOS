import { expect, test } from '@playwright/test';

test.describe('compound intelligence library', () => {
  test('browses GLP-1 Retatrutide setup and saves a protocol-ready stack', async ({ page }) => {
    await page.goto('/library');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('link', { name: /Browse categories/ }).click();
    await expect(page.getByRole('heading', { name: 'Select Category' })).toBeVisible();
    await page.getByRole('link', { name: /GLP-1/ }).click();

    await expect(page.getByRole('heading', { name: 'GLP-1' })).toBeVisible();
    await expect(page.getByText('Retatrutide')).toBeVisible();
    await expect(page.getByText('Protocol')).toBeVisible();
    await page.getByRole('link', { name: 'Setup Retatrutide protocol' }).click();

    await expect(page.getByRole('heading', { name: 'Retatrutide' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Protocol Setup' })).toBeVisible();
    await page.getByRole('link', { name: /Triple Agonist/ }).click();

    await expect(page.getByRole('heading', { name: 'Protocol Preview' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Triple Agonist' })).toBeVisible();
    await expect(page.getByRole('button', { name: '4 mg' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Monitor resting heart rate, HRV, sleep')).toBeVisible();

    await page.getByRole('button', { name: 'Save planned stack' }).click();
    await expect(page).toHaveURL(/\/stacks$/);
    const savedStack = page.getByRole('link', { name: /Triple Agonist/ });
    await expect(savedStack).toBeVisible();
    await expect(savedStack.getByText('Planned')).toBeVisible();
    await expect(savedStack.getByText('Retatrutide', { exact: true })).toBeVisible();
  });
});
