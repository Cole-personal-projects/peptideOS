import { expect, test } from '@playwright/test';

test.describe('Peppi assistant entrypoints', () => {
  test('opens Peppi from quick actions', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Quick actions' }).click();
    await page.getByRole('button', { name: 'Peppi' }).click();

    await expect(page).toHaveURL(/\/more\/ai-assistant$/);
    await expect(page.getByRole('heading', { name: 'Peppi' })).toBeVisible();
  });

  test('does not label Peppi as coming soon', async ({ page }) => {
    await page.goto('/more');

    await page.getByRole('button', { name: 'I Understand' }).click();
    const aiAssistantLink = page.getByRole('link', { name: /Peppi/ });

    await expect(aiAssistantLink).toBeVisible();
    await expect(aiAssistantLink).not.toContainText('Soon');
  });
});
