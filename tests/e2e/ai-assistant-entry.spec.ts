import { expect, test } from '@playwright/test';

test.describe('AI assistant entrypoints', () => {
  test('opens AI Assistant from quick actions', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Quick actions' }).click();
    await page.getByRole('button', { name: 'AI Assistant' }).click();

    await expect(page).toHaveURL(/\/more\/ai-assistant$/);
    await expect(page.getByRole('heading', { name: 'AI Assistant' })).toBeVisible();
  });

  test('does not label AI Assistant as coming soon', async ({ page }) => {
    await page.goto('/more');

    await page.getByRole('button', { name: 'I Understand' }).click();
    const aiAssistantLink = page.getByRole('link', { name: /AI Assistant/ });

    await expect(aiAssistantLink).toBeVisible();
    await expect(aiAssistantLink).not.toContainText('Soon');
  });
});
