import { expect, test } from '@playwright/test';

test.describe('compound workflows', () => {
  test('uses a custom compound in vial, dose, and stack flows', async ({ page }) => {
    await page.goto('/library');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Add compound' }).click();
    await page.getByLabel('Name').fill('Custom Recovery Blend');
    await page.getByLabel('Type', { exact: true }).selectOption('peptide');
    await page.getByLabel('Category', { exact: true }).selectOption('healing');
    await page.getByLabel('Route', { exact: true }).selectOption('subq');
    await page.getByLabel('Unit', { exact: true }).selectOption('mg');
    await page.getByLabel('Summary').fill('Private recovery compound for workflow testing.');
    await page.getByRole('button', { name: 'Save compound' }).click();
    await expect(page.getByRole('link', { name: /Custom Recovery Blend/ })).toBeVisible();

    await page.goto('/more/inventory');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('textbox', { name: 'Vial name' }).fill('Custom Recovery Backup');
    await page.getByRole('combobox').filter({ hasText: 'Select compound' }).click();
    await page.getByRole('option', { name: 'Custom Recovery Blend' }).click();
    await page.getByLabel('Date added').fill('2026-05-24');
    await page.getByRole('spinbutton', { name: 'Vial size' }).fill('10');
    await page.getByRole('button', { name: 'Add Vial' }).click();
    await page.getByRole('tab', { name: /Sealed/ }).click();
    await expect(page.getByRole('link', { name: /Custom Recovery Backup/ })).toContainText('Custom Recovery Blend');

    await page.getByRole('button', { name: 'Quick actions' }).click();
    await page.getByRole('button', { name: 'Add Vial' }).click();
    await page.getByRole('combobox').filter({ hasText: 'Select compound' }).click();
    await page.getByRole('option', { name: 'Custom Recovery Blend' }).click();
    await page.getByPlaceholder('Optional vial source').fill('Private');
    await page.getByPlaceholder('e.g., BPC-2024-001').fill('CUSTOM-001');
    await page.getByRole('spinbutton', { name: 'Vial size' }).fill('10');
    await page.getByRole('combobox').filter({ hasText: 'Sealed' }).click();
    await page.getByRole('option', { name: 'Active (Reconstituted)' }).click();
    await page.getByRole('button', { name: 'Add Vial' }).click();

    await page.getByRole('button', { name: 'Quick actions' }).click();
    await page.getByRole('button', { name: 'Log Dose' }).click();
    await page.getByRole('combobox').filter({ hasText: 'Select compound' }).click();
    await page.getByRole('option', { name: 'Custom Recovery Blend' }).click();
    await page.getByRole('combobox').filter({ hasText: 'Select vial' }).click();
    await page.getByRole('option', { name: /CUSTOM-001/ }).click();
    await page.getByPlaceholder('e.g., 250').fill('1.5');
    await page.getByRole('button', { name: 'Upper Left Abdomen' }).click();
    await page.getByRole('button', { name: 'Log Dose' }).click();

    await page.getByRole('link', { name: 'Log' }).click();
    await expect(page.getByRole('heading', { name: 'Dose Log' })).toBeVisible();
    await expect(page.getByText('Custom Recovery Blend').first()).toBeVisible();
    await expect(page.getByText('1.5 mg').first()).toBeVisible();

    await page.getByRole('link', { name: 'Stacks' }).click();
    await page.getByRole('button', { name: 'New stack' }).click();
    await page.getByLabel('Stack Name').fill('Custom Recovery Stack');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('checkbox', { name: 'Custom Recovery Blend' }).check();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('1 mg').first()).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Custom Recovery Stack')).toBeVisible();
    await expect(page.getByText('Custom Recovery Blend').last()).toBeVisible();
    await page.getByRole('button', { name: 'Create Stack' }).click();
    await expect(page.getByText('Custom Recovery Stack')).toBeVisible();
  });
});
