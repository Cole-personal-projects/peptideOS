import { expect, test } from '@playwright/test';
import { addTestVial } from './helpers/inventory';

test.describe('reconstitute vial flow', () => {
  test('activates a sealed vial with BAC water and concentration preview', async ({ page }) => {
    await addTestVial(page, {
      name: 'GHK-Cu sealed vial',
      compound: 'GHK-Cu',
      size: '10',
      status: 'sealed',
    });

    await page.getByRole('tab', { name: /Sealed/ }).click();
    await page.getByRole('link', { name: /GHK-Cu sealed vial/ }).click();
    await expect(page.getByRole('heading', { name: 'GHK-Cu sealed vial' })).toBeVisible();
    await expect(page.getByText('sealed', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Reconstitute' }).click();
    await expect(page.getByRole('dialog', { name: 'Reconstitute vial' })).toBeVisible();

    await page.getByRole('spinbutton', { name: 'BAC water volume' }).fill('2');
    await expect(page.getByText('5.00 mg/mL (5000 mcg/mL)')).toBeVisible();

    await page.getByRole('button', { name: 'Activate vial' }).click();
    await expect(page.getByRole('dialog', { name: 'Reconstitute vial' })).toHaveCount(0);
    await expect(page.getByText('active')).toBeVisible();
    await expect(page.getByText('BAC Water')).toBeVisible();
    await expect(page.getByText('2mL')).toBeVisible();
    await expect(page.getByText('5.00')).toBeVisible();
    await expect(page.getByText('mg per mL')).toBeVisible();

    await page.getByRole('link', { name: 'Back' }).click();
    await page.getByRole('tab', { name: /Active/ }).click();
    const reconstitutedCard = page.getByRole('link', { name: /GHK-Cu sealed vial/ });
    await expect(reconstitutedCard).toContainText('GHK-Cu');
    await expect(reconstitutedCard).toContainText('active');
    await expect(reconstitutedCard).toContainText(/\d+ days left/);
  });
});
