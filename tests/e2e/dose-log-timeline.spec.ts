import { expect, test } from '@playwright/test';

test.describe('dose log timeline', () => {
  test('shows day-grouped native-unit dose history with completion state', async ({ page }) => {
    await page.goto('/log');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('tab', { name: 'List view' }).click();

    await expect(page.getByText('2.5 mg').first()).toBeVisible();
    await expect(page.getByText('250 mcg').first()).toBeVisible();
    await expect(page.getByText('Planned').first()).toBeVisible();
    await expect(page.getByText('Completed').first()).toBeVisible();
  });
});
