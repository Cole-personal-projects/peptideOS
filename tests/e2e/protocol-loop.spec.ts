import { expect, test } from '@playwright/test';
import { addTestVial } from './helpers/inventory';

test.describe('protocol loop', () => {
  test('starts a stack, completes a scheduled dose, and persists schedule state', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-05-23T12:00:00-07:00'));
    await addTestVial(page, {
      name: 'BPC-157 active vial',
      compound: 'BPC-157',
      status: 'active',
    });

    await page.goto('/stacks');

    await page.getByRole('button', { name: 'New stack' }).click();
    await page.getByLabel('Stack Name').fill('Protocol Loop Test Stack');
    await page.getByLabel('Duration (days)').fill('2');
await page.getByRole('button', { name: 'Next' }).click();
await page.getByRole('checkbox', { name: 'BPC-157' }).check();
await page.getByLabel('Schedule').click();
await page.getByRole('option', { name: /2x daily/ }).click();
await page.getByRole('button', { name: 'Create Stack' }).click();

await page.getByRole('link', { name: /Protocol Loop Test Stack/ }).click();
await page.getByRole('button', { name: 'Protocol settings' }).click();
await page.getByRole('button', { name: 'Start' }).click();
await expect(page.getByRole('heading', { name: 'Upcoming Doses' })).toBeVisible();
await expect(page.getByText('BPC-157').first()).toBeVisible();

    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page.getByText('BPC-157').first()).toBeVisible();
    await expect(page.getByText('250 mcg').first()).toBeVisible();
  await page.getByRole('button', { name: 'Complete' }).first().click();
  const completeDialog = page.getByRole('dialog', { name: 'Complete scheduled dose' });
  await expect(completeDialog).toBeVisible();
  await completeDialog.getByRole('combobox', { name: 'Vial' }).click();
  await expect(page.getByRole('option', { name: /left/ }).first()).toBeVisible();
  await page.getByRole('option', { name: /BPC-157 active vial/ }).click();
  await completeDialog.getByRole('button', { name: 'Upper Left Abdomen', exact: true }).click();
  await completeDialog.getByRole('button', { name: 'Complete dose' }).click();

    await expect(page.getByRole('dialog', { name: 'Complete scheduled dose' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Recent' })).toBeVisible();
    await expect(page.getByText('BPC-157').first()).toBeVisible();
    await expect(page.getByText('250 mcg').first()).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Recent' })).toBeVisible();
    await expect(page.getByText('BPC-157').first()).toBeVisible();
    await expect(page.getByText('250 mcg').first()).toBeVisible();

    await page.getByRole('navigation').getByRole('link', { name: 'Log' }).click();
    await expect(page.getByRole('heading', { name: 'Dose Log' })).toBeVisible();
    await expect(page.getByText('BPC-157').first()).toBeVisible();
    await expect(page.getByText('250 mcg').first()).toBeVisible();

    await page.goto('/more/inventory');
    await page.getByRole('tab', { name: /Active/ }).click();
    const bpcCard = page.getByRole('link', { name: /BPC-157 active vial/ });
    await expect(bpcCard).toContainText('BPC-157 active vial');
    await expect(bpcCard).toContainText('Remaining');

await page.goto('/stacks');
await page.getByRole('link', { name: /Protocol Loop Test Stack/ }).click();
await page.getByRole('button', { name: 'Protocol settings' }).click();
await page.getByRole('button', { name: 'Edit protocol' }).click();
await page.getByLabel('BPC-157 schedule').click();
await page.getByRole('option', { name: /Weekly/ }).click();
await page.getByRole('button', { name: 'Save changes' }).click();
await expect(page.getByText('Weekly · Monday · 8:00 AM').first()).toBeVisible();
await page.reload();
await expect(page.getByText('Weekly · Monday · 8:00 AM').first()).toBeVisible();

await expect(page.getByRole('heading', { name: '14-Day Trajectory' })).toBeVisible();
await expect(page.getByRole('heading', { name: 'Upcoming Doses' })).toBeVisible();
  });
});
