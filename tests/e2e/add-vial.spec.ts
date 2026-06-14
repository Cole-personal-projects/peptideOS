import { expect, test } from '@playwright/test';

test.describe('add vial', () => {
  test('creates a named sealed vial and shows its date added on details', async ({ page }) => {
    await page.goto('/more/inventory');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();

    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('dialog', { name: 'Add Vial' })).toBeVisible();

    await page.getByRole('textbox', { name: 'Vial name' }).fill('Travel GHK-Cu');
    await page.getByRole('combobox').filter({ hasText: 'Select compound' }).click();
    await page.getByRole('option', { name: 'GHK-Cu' }).click();
    await page.getByLabel('Date added').fill('2026-05-20');
    await page.getByRole('spinbutton', { name: 'Vial size' }).fill('50');
    await page.getByRole('button', { name: 'Add Vial' }).click();

    await page.getByRole('tab', { name: /Sealed/ }).click();
    const newVialCard = page.getByRole('link', { name: /Travel GHK-Cu/ });
    await expect(newVialCard).toBeVisible();
    await expect(newVialCard).toContainText('Added May 20, 2026');

    await newVialCard.click();
    await expect(page.getByRole('heading', { name: 'Travel GHK-Cu' })).toBeVisible();
    await expect(page.getByLabel('Date Added May 20, 2026')).toBeVisible();
    await expect(page.getByText('GHK-Cu', { exact: true })).toBeVisible();
  });

  test('creates ten physical vials when adding one kit from inventory', async ({ page }) => {
    await page.goto('/more/inventory');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('textbox', { name: 'Vial name' }).fill('KPV kit test');
    await page.getByRole('combobox').filter({ hasText: 'Select compound' }).click();
    await page.getByRole('option', { name: 'KPV' }).click();
    await page.getByLabel('Date added').fill('2026-06-14');
    await page.getByRole('spinbutton', { name: 'Vial size' }).fill('10');
    await page.getByLabel('Inventory unit').selectOption('kit');
    await page.getByRole('spinbutton', { name: 'Inventory amount' }).fill('1');
    await page.getByRole('button', { name: 'Add Vial' }).click();

    await page.getByRole('tab', { name: /Sealed/ }).click();
    await expect(page.getByRole('link', { name: /KPV kit test vial/ })).toHaveCount(10);
    await expect(page.getByRole('link', { name: /KPV kit test vial 1 of 10/ })).toContainText('10 mg');
  });

  test('edits vial details after creation', async ({ page }) => {
    await page.goto('/more/inventory');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('textbox', { name: 'Vial name' }).fill('Editable KPV vial');
    await page.getByRole('combobox').filter({ hasText: 'Select compound' }).click();
    await page.getByRole('option', { name: 'KPV' }).click();
    await page.getByRole('spinbutton', { name: 'Vial size' }).fill('10');
    await page.getByRole('button', { name: 'Add Vial' }).click();

    await page.getByRole('tab', { name: /Sealed/ }).click();
    await page.getByRole('link', { name: /Editable KPV vial/ }).click();
    await page.getByRole('button', { name: 'Edit vial' }).click();
    await page.getByRole('textbox', { name: 'Vial name' }).fill('Edited KPV vial');
    await page.getByRole('spinbutton', { name: 'Vial size' }).fill('12');
    await page.getByRole('textbox', { name: 'Source' }).fill('Cold pack');
    await page.getByRole('textbox', { name: 'Lot Number' }).fill('KPV-EDIT-001');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByRole('heading', { name: 'Edited KPV vial' })).toBeVisible();
    await expect(page.getByText('12 mg')).toBeVisible();
    await expect(page.getByText('Cold pack')).toBeVisible();
    await expect(page.getByText('KPV-EDIT-001')).toBeVisible();
  });

  test('creates a concentration-based testosterone multi-dose vial from quick actions', async ({ page }) => {
    await page.goto('/more/inventory');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Quick actions' }).click();
    await page.getByRole('button', { name: 'Add Vial' }).click();

    await page.getByRole('combobox').filter({ hasText: 'Select compound' }).click();
    await page.getByRole('option', { name: 'Testosterone Cypionate' }).click();
    await expect(page.getByRole('combobox').filter({ hasText: 'Multi-dose vial' })).toBeVisible();

    await page.getByPlaceholder('Optional vial source').fill('Pharmacy');
    await page.getByPlaceholder('e.g., BPC-2024-001').fill('TEST-CYP-001');
    await page.getByPlaceholder('e.g., 200').fill('200');
    await page.getByPlaceholder('e.g., 10').fill('10');
    await page.getByRole('combobox').filter({ hasText: 'Sealed' }).click();
    await page.getByRole('option', { name: 'Active (Reconstituted)' }).click();
    await page.getByRole('button', { name: 'Add Vial' }).click();

    await expect(page.getByRole('link', { name: /Testosterone Cypionate container/ })).toContainText('200 mg/mL · 10 mL');
    await page.getByRole('link', { name: /Testosterone Cypionate container/ }).click();
    await expect(page.getByRole('heading', { name: 'Testosterone Cypionate container' })).toBeVisible();
    await expect(page.getByText('multi dose vial')).toBeVisible();
    await expect(page.getByText('200 mg/mL · 10 mL')).toBeVisible();
  });
});
