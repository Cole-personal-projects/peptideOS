import { expect, test } from '@playwright/test';

test.describe('AI assistant action approvals', () => {
  test('proposes and confirms a Signal check-in from chat', async ({ page }) => {
    await page.goto('/more/ai-assistant');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('textbox', { name: 'Message Haiku' }).fill('Energy was 7, slept 6 hours, shoulder calm today.');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByText('I will add this Signal check-in.')).toBeVisible();
    await expect(page.getByText('Energy 7/10')).toBeVisible();
    await expect(page.getByText('Sleep 6 hr')).toBeVisible();
    await expect(page.getByText('shoulder calm today')).toBeVisible();

    await page.getByRole('button', { name: 'Confirm Signal' }).click();
    await expect(page.getByText('Signal check-in saved.')).toBeVisible();

    await page.getByRole('link', { name: 'More' }).click();
    await page.getByRole('link', { name: /Signals/ }).click();

    await expect(page.getByText('Energy 7/10')).toBeVisible();
    await expect(page.getByText('Sleep 6 hr')).toBeVisible();
    await expect(page.getByText('shoulder calm today')).toBeVisible();

    await page.reload();

    await expect(page.getByText('Energy 7/10')).toBeVisible();
    await expect(page.getByText('Sleep 6 hr')).toBeVisible();
    await expect(page.getByText('shoulder calm today')).toBeVisible();
  });
});
