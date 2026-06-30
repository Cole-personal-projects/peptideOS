import { expect, test } from '@playwright/test';

test.describe('MVP tester walkthrough', () => {
  test('covers onboarding, vial creation, stack activation, due dose completion, and export', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-05-26T12:00:00-07:00'));

    await page.goto('/');
    await page.getByRole('button', { name: 'Start setup' }).click();
    await page.getByRole('radio', { name: 'Researcher' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Enter PeptideOS' }).click();
    await expect(page.getByRole('heading', { name: 'PeptideOS' })).toBeVisible();

    await page.goto('/more/inventory');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByRole('textbox', { name: 'Vial name' }).fill('MVP Walkthrough BPC');
    await page.getByRole('combobox').filter({ hasText: 'Select compound' }).click();
    await page.getByRole('option', { name: 'BPC-157' }).click();
    await page.getByLabel('Date added').fill('2026-05-26');
    await page.getByRole('spinbutton', { name: 'Vial size' }).fill('5');
    await page.getByRole('combobox', { name: 'Status' }).click();
    await page.getByRole('option', { name: 'Active (Reconstituted)' }).click();
    await page.getByRole('button', { name: 'Add Vial' }).click();
    await page.getByRole('tab', { name: /Active/ }).click();
    await expect(page.getByRole('link', { name: /MVP Walkthrough BPC/ })).toContainText('Added May 26, 2026');

    await page.goto('/stacks');
    await page.getByRole('button', { name: 'New protocol' }).click();
    await page.getByLabel('Protocol Name').fill('MVP Walkthrough Stack');
    await page.getByRole('button', { name: 'Next' }).click();
await page.getByRole('checkbox', { name: 'BPC-157' }).check();
await page.getByLabel('Schedule').click();
await page.getByRole('option', { name: /Daily/ }).click();
await page.getByRole('button', { name: 'Create Protocol' }).click();

await page.getByRole('link', { name: /MVP Walkthrough Stack/ }).click();
await page.getByRole('button', { name: 'Protocol settings' }).click();
await page.getByRole('button', { name: 'Start' }).click();
await expect(page.getByText('Active', { exact: true }).first()).toBeVisible();
await expect(page.getByRole('heading', { name: 'Upcoming Doses' })).toBeVisible();

    await page.goto('/');
    await expect(page.getByText('BPC-157').first()).toBeVisible();
    await expect(page.getByText('250 mcg').first()).toBeVisible();
    await page.getByRole('button', { name: 'Complete' }).first().click();
    const completeDialog = page.getByRole('dialog', { name: 'Complete scheduled dose' });
    await expect(completeDialog).toBeVisible();
    await completeDialog.getByRole('combobox', { name: 'Vial' }).click();
    await page.getByRole('option', { name: /MVP Walkthrough BPC/ }).click();
    await completeDialog.getByRole('button', { name: 'Upper Left Abdomen', exact: true }).click();
    await completeDialog.getByRole('button', { name: 'Complete dose' }).click();
    await expect(page.getByText('Taken today', { exact: true }).first()).toBeVisible();

    await page.goto('/log');
    await expect(page.getByRole('heading', { name: 'Dose Log' })).toBeVisible();
    await expect(page.getByText('BPC-157').first()).toBeVisible();
    await expect(page.getByText('250 mcg').first()).toBeVisible();

    await page.goto('/more/settings');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export full backup' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('peptideos-export-2026-05-26.json');
  });
});
