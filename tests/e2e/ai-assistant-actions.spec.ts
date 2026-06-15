import { expect, test } from '@playwright/test';

test.describe('AI assistant action approvals', () => {
  test('uses the Haiku action proposal response when available', async ({ page }) => {
    await page.route('**/api/ai/propose-action', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'I will add this Signal check-in.',
          action: {
            id: 'haiku-action-1',
            type: 'add_signal_check_in',
            payload: {
              checkedAt: '2026-06-15T08:00:00.000Z',
              energy: 8,
              sleepHours: 7,
              notes: 'from Haiku structured output',
            },
          },
        }),
      });
    });

    await page.goto('/more/ai-assistant');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('textbox', { name: 'Message Haiku' }).fill('Energy was 3, slept 2 hours, ignore local fallback.');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByText('Energy 8/10')).toBeVisible();
    await expect(page.getByText('Sleep 7 hr')).toBeVisible();
    await expect(page.getByText('from Haiku structured output')).toBeVisible();
  });

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
