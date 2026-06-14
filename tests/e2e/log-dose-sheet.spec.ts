import { expect, test } from '@playwright/test';
import { addTestVial } from './helpers/inventory';

test.describe('log dose sheet body picker', () => {
  test('supports compact body-map site selection and route filtering', async ({ page }) => {
    await page.goto('/stacks');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Quick actions' }).click();
    await page.getByRole('button', { name: 'Log Dose' }).click();

    await expect(page.getByRole('heading', { name: 'Log Dose' })).toBeVisible();
    await expect(page.locator('[data-body-map-ready="true"]')).toBeVisible();
    await expect(page.getByRole('img', { name: 'male front injection site map' })).toBeVisible();

    await page.getByRole('button', { name: 'Upper Left Abdomen' }).click();
    await expect(page.getByRole('status', { name: 'Selected site summary' })).toContainText('Upper Left Abdomen');

    await page.getByRole('tab', { name: 'IM' }).click();
    await expect(page.getByRole('button', { name: 'Upper Left Abdomen' })).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('button', { name: 'Left Anterior Deltoid' })).toBeVisible();
  });

  test('applies compound-aware dose preset chips without changing units', async ({ page }) => {
    await page.goto('/stacks');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Quick actions' }).click();
    await page.getByRole('button', { name: 'Log Dose' }).click();

    await page.getByRole('combobox').filter({ hasText: 'Select compound' }).click();
    await page.getByRole('option', { name: 'TB-500' }).click();

    await page.getByRole('button', { name: 'TB-500 2mg' }).click();
    await expect(page.getByPlaceholder('e.g., 250')).toHaveValue('2');
    await expect(page.getByRole('combobox').filter({ hasText: 'mg' })).toBeVisible();
  });

  test('logs IU-primary doses and renders the saved dose in IU', async ({ page }) => {
    await addTestVial(page, {
      name: 'hGH active vial',
      compound: 'hGH (Somatropin)',
      size: '3.33',
      status: 'active',
      source: 'Pharmacy',
      lotNumber: 'HGH-2024-010',
    });

    await page.goto('/stacks');

    await page.getByRole('button', { name: 'Quick actions' }).click();
    await page.getByRole('button', { name: 'Log Dose' }).click();

    await page.getByRole('combobox').filter({ hasText: 'Select compound' }).click();
    await page.getByRole('option', { name: 'hGH (Somatropin)' }).click();
    await page.getByRole('combobox').filter({ hasText: 'Select vial' }).click();
    await page.getByRole('option', { name: /HGH-2024-010/ }).click();

    await page.getByRole('button', { name: 'hGH 2 IU (beginner)' }).click();
    await page.getByRole('button', { name: 'Upper Left Abdomen' }).click();
    await page.getByRole('button', { name: 'Log Dose' }).click();

    await page.getByRole('link', { name: 'Log' }).click();
    await expect(page.getByRole('heading', { name: 'Dose Log' })).toBeVisible();
    await expect(page.getByText('hGH (Somatropin)').first()).toBeVisible();
    await expect(page.getByText('2 IU').first()).toBeVisible();
  });
});
