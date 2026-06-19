import { expect, test } from '@playwright/test';

test.describe('Peppi assistant entrypoints', () => {
  test('opens the full reconstitution calculator from quick actions', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Quick actions' }).click();
    await page.getByRole('button', { name: 'Calculate Reconstitution' }).click();

    await expect(page).toHaveURL(/\/more\/reconstitution$/);
    await expect(page.getByRole('heading', { name: 'Reconstitution Calculator' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
    await expect(page.getByLabel('Saved reconstitution calculations')).toBeVisible();
  });

  test('opens Peppi from quick actions', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Get started' }).click();
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

  test('keeps Peppi as one chat with workflow prompts inside the composer', async ({ page }) => {
    await page.goto('/more/ai-assistant');

    await page.getByRole('button', { name: 'I Understand' }).click();

    await expect(page.getByRole('heading', { name: 'Protocol Assistant' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Describe a protocol' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Open Peppi workflow prompts' }).click();
    await page.getByRole('button', { name: 'Add to my schedule' }).click();

    await expect(page.getByRole('textbox', { name: 'Message Peppi' })).toHaveValue(/schedule/i);
  });

  test('opens the full calculator from Peppi reconstitution workflow prompt', async ({ page }) => {
    await page.goto('/more/ai-assistant');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Open Peppi workflow prompts' }).click();
    await page.getByRole('button', { name: 'Calculate reconstitution' }).click();

    await expect(page).toHaveURL(/\/more\/reconstitution$/);
    await expect(page.getByRole('heading', { name: 'Reconstitution Calculator' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
  });
});
