import { expect, test } from '@playwright/test';

test.describe('app back navigation', () => {
  test('returns from protocol detail to the previous protocol list screen', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('link', { name: 'Protocols' }).click();
    await expect(page).toHaveURL(/\/stacks$/);

    await page.getByRole('button', { name: 'New protocol' }).click();
    await page.getByLabel('Protocol Name').fill('Back Navigation Protocol');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('checkbox', { name: 'BPC-157' }).check();
    await page.getByRole('button', { name: 'Create Protocol' }).click();
    await page.getByRole('link', { name: /Back Navigation Protocol/ }).click();
    await expect(page).toHaveURL(/\/stacks\/stack-/);

    await page.getByRole('button', { name: 'Back to previous screen' }).click();
    await expect(page).toHaveURL(/\/stacks$/);
    await expect(page.getByRole('heading', { name: 'Protocols' })).toBeVisible();
  });
});
