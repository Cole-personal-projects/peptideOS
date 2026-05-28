import { expect, test } from '@playwright/test';

test.describe('MVP tester walkthrough', () => {
  test('covers onboarding, vial creation, stack activation, due dose completion, and export', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-05-26T12:00:00-07:00'));

    await page.goto('/');
    await page.getByRole('button', { name: 'Set up profile' }).click();
    await page.getByRole('radio', { name: 'Researcher' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Enter PeptideOS' }).click();
    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toBeVisible();

    await page.goto('/more/inventory');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('textbox', { name: 'Vial name' }).fill('MVP Walkthrough BPC');
    await page.getByLabel('Compound').selectOption('bpc-157');
    await page.getByLabel('Date added').fill('2026-05-26');
    await page.getByRole('button', { name: 'Create vial' }).click();
    await page.getByRole('tab', { name: /Sealed/ }).click();
    await expect(page.getByRole('link', { name: /MVP Walkthrough BPC/ })).toContainText('Added May 26, 2026');

    await page.goto('/stacks');
    await page.getByRole('button', { name: 'New stack' }).click();
    await page.getByLabel('Stack Name').fill('MVP Walkthrough Stack');
    await page.getByLabel('Duration (days)').fill('2');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('checkbox', { name: 'BPC-157' }).check();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByLabel('Schedule').click();
    await page.getByRole('option', { name: /Daily/ }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Create Stack' }).click();

    await page.getByRole('link', { name: /MVP Walkthrough Stack/ }).click();
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.getByText(/pending/).first()).toBeVisible();

    await page.goto('/');
    await expect(page.getByText(/BPC-157 - 250 mcg/).first()).toBeVisible();
    await page.getByRole('button', { name: 'Complete' }).first().click();
    await page.getByRole('combobox').filter({ hasText: 'Select active vial' }).click();
    await page.getByRole('option', { name: /BPC-157 active vial/ }).click();
    await page.getByRole('button', { name: 'Upper Left Abdomen' }).click();
    await page.getByRole('button', { name: 'Complete dose' }).click();
    await expect(page.getByText('Taken today', { exact: true }).first()).toBeVisible();

    await page.goto('/log');
    await expect(page.getByRole('heading', { name: 'Dose Log' })).toBeVisible();
    await expect(page.getByText('BPC-157').first()).toBeVisible();
    await expect(page.getByText('250 mcg').first()).toBeVisible();

    await page.goto('/more/settings');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export All Data' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('peptideos-export-2026-05-26.json');
  });
});
