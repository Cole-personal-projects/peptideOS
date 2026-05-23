import { expect, test } from '@playwright/test';

test.describe('protocol loop', () => {
  test('starts a stack, completes a scheduled dose, and persists schedule state', async ({ page }) => {
    await page.goto('/stacks');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'New stack' }).click();
    await page.getByLabel('Stack Name').fill('Protocol Loop Test Stack');
    await page.getByLabel('Duration (days)').fill('2');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('checkbox', { name: 'BPC-157' }).check();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByLabel('Schedule').click();
    await page.getByRole('option', { name: /2x daily/ }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Create Stack' }).click();

    await page.getByRole('link', { name: /Protocol Loop Test Stack/ }).click();
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.getByText(/pending/).last()).toBeVisible();

    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page.getByText(/BPC-157 - 250 mcg/).first()).toBeVisible();
    await page.getByRole('button', { name: 'Complete' }).first().click();
    await expect(page.getByRole('dialog', { name: 'Complete scheduled dose' })).toBeVisible();
    await page.getByRole('combobox').filter({ hasText: 'Select active vial' }).click();
    await page.getByRole('option', { name: /BPC-157 active vial/ }).click();
    await page.getByRole('button', { name: 'Upper Left Abdomen' }).click();
    await page.getByRole('button', { name: 'Complete dose' }).click();

    await expect(page.getByRole('dialog', { name: 'Complete scheduled dose' })).toHaveCount(0);
    await expect(page.getByText(/taken/).first()).toBeVisible();
    await page.reload();
    await expect(page.getByText(/taken/).first()).toBeVisible();

    await page.getByRole('link', { name: 'Log' }).click();
    await expect(page.getByRole('heading', { name: 'Dose Log' })).toBeVisible();
    await expect(page.getByText('BPC-157').first()).toBeVisible();
    await expect(page.getByText('250 mcg').first()).toBeVisible();

    await page.goto('/more/inventory');
    await page.getByRole('tab', { name: /Active/ }).click();
    const bpcCard = page.locator('a[href="/more/inventory/vial-1"]');
    await expect(bpcCard).toContainText('BPC-157 active vial');
    await expect(bpcCard).toContainText('Remaining');

    await page.goto('/');
    await page.getByRole('button', { name: 'Skip' }).first().click();
    await expect(page.getByText(/skipped/).first()).toBeVisible();
    await page.reload();
    await expect(page.getByText(/skipped/).first()).toBeVisible();

    await page.goto('/stacks');
    await page.getByRole('link', { name: /Protocol Loop Test Stack/ }).click();
    await page.getByRole('tab', { name: 'Calendar' }).click();
    await expect(page.getByText(/taken/)).toBeVisible();
    await expect(page.getByText(/skipped/)).toBeVisible();
  });
});
