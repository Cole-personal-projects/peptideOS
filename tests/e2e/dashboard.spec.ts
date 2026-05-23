import { expect, test } from '@playwright/test';

test.describe('dashboard polish', () => {
  test('shows briefing and adherence widgets after first-run accept', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'I Understand' }).click();

    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toBeVisible();
    await expect(page.getByText("Today's Briefing")).toBeVisible();
    await expect(page.getByText('Dose completion')).toBeVisible();
    await expect(page.getByText(/\d+\/\d+/).first()).toBeVisible();
    await expect(page.getByText('Pending')).toBeVisible();
    await expect(page.getByText('Adherence')).toBeVisible();
    await expect(page.getByLabel('Recent adherence')).toBeVisible();
  });
});
