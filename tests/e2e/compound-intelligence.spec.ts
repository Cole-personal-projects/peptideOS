import { expect, test } from '@playwright/test';

test.describe('compound intelligence library', () => {
  test('browses GLP-1 Retatrutide setup and saves a protocol-ready plan', async ({ page }) => {
    await page.goto('/library');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('link', { name: /Browse collections/ }).click();
    await expect(page.getByRole('heading', { name: 'Select Collection' })).toBeVisible();
    await expect(page.getByRole('link', { name: /GLP-1/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Metabolic/ })).toBeVisible();
    await page.getByRole('link', { name: /GLP-1/ }).click();

    await expect(page.getByRole('heading', { name: 'GLP-1' })).toBeVisible();
    await expect(page.getByText('Semaglutide')).toBeVisible();
    await expect(page.getByText('Tirzepatide')).toBeVisible();
    await expect(page.getByText('Retatrutide')).toBeVisible();
    await expect(page.getByText('Protocol', { exact: true }).first()).toBeVisible();
    await page.getByRole('link', { name: 'Setup Retatrutide protocol' }).click();

    await expect(page.getByRole('heading', { name: 'Retatrutide' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Protocol Setup' })).toBeVisible();
    await page.getByRole('link', { name: /Triple Agonist/ }).click();

    await expect(page.getByRole('heading', { name: 'Protocol Preview' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Triple Agonist' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dose ladder' })).toBeVisible();
    await expect(page.getByText('20 planned events')).toBeVisible();
    await expect(page.getByText('Phase 1', { exact: true })).toBeVisible();
    await expect(page.getByText('0.5 mg').first()).toBeVisible();
    await expect(page.getByText('Monitor resting heart rate, HRV, sleep')).toBeVisible();

    await page.getByRole('button', { name: 'Save planned protocol' }).click();
    await expect(page).toHaveURL(/\/stacks$/);
    const savedStack = page.getByRole('link', { name: /Triple Agonist/ });
    await expect(savedStack).toBeVisible();
    await expect(savedStack.getByText('Planned')).toBeVisible();
    await expect(savedStack.getByText('Retatrutide', { exact: true })).toHaveCount(4);
  });

  test('opens custom setup for GLP-1 compounds without protocol templates', async ({ page }) => {
    await page.goto('/library/categories/glp-1');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'GLP-1' })).toBeVisible();
    await page.getByRole('link', { name: 'Setup Semaglutide protocol' }).click();

    await expect(page.getByRole('heading', { name: 'Semaglutide' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Protocol Setup' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Custom Setup/ })).toBeVisible();
  });
});
