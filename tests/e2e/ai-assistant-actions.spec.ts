import { expect, test } from '@playwright/test';

test.describe('Peppi action approvals', () => {
  test('summarizes today locally without calling AI', async ({ page }) => {
    let aiRequested = false;
    await page.route('**/api/ai/propose-action', async (route) => {
      aiRequested = true;
      await route.abort();
    });

    await page.goto('/more/ai-assistant');
    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('textbox', { name: 'Message Peppi' }).fill('Summarize today');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByText('Today’s operating summary')).toBeVisible();
    await expect(page.getByLabel('Peppi today summary cards')).toBeVisible();
    await expect(page.getByText('0 due later today · 0 overdue · 0 completed · 0 skipped or missed')).toBeVisible();
    await expect(page.getByText('Next dose action')).toBeVisible();
    await expect(page.getByText('No dose action due today.')).toBeVisible();
    await expect(page.getByText('Inventory coverage', { exact: true })).toBeVisible();
    await expect(page.getByText('Not dosing or safety advice')).toBeVisible();
    expect(aiRequested).toBe(false);
  });

  test('proposes and confirms sealed kit inventory from chat', async ({ page }) => {
    await page.route('**/api/ai/propose-action', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'I will add 10 sealed KPV vials, 10 mg each. Confirm?',
          action: {
            id: 'peppi-inventory-action-1',
            type: 'create_inventory_vials',
            payload: {
              name: 'AI KPV kit',
              peptideId: 'kpv',
              dateAdded: '2026-06-15',
              containerType: 'lyophilized-vial',
              totalAmountValue: 10,
              totalAmountUnit: 'mg',
              packageUnit: 'kit',
              packageQuantity: 1,
            },
          },
        }),
      });
    });

    await page.goto('/more/ai-assistant');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('textbox', { name: 'Message Peppi' }).fill('Add one kit of KPV 10mg sealed.');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByText('I will add 10 sealed KPV vials, 10 mg each. Confirm?')).toBeVisible();
    await expect(page.getByText('AI KPV kit')).toBeVisible();
    await expect(page.getByText('KPV', { exact: true })).toBeVisible();
    await expect(page.getByText('10 mg each · 10 sealed vials')).toBeVisible();

    await page.getByRole('button', { name: 'Confirm Inventory' }).click();
    await expect(page.getByText('Inventory saved.')).toBeVisible();

    await page.getByRole('link', { name: 'More' }).click();
    await page.getByRole('link', { name: /Inventory/ }).click();
    await page.getByRole('tab', { name: /Sealed/ }).click();

    await expect(page.getByRole('link', { name: /AI KPV kit/ })).toHaveCount(1);
    await expect(page.getByRole('link', { name: /AI KPV kit/ })).toContainText('10 sealed vials');
    await expect(page.getByRole('link', { name: /AI KPV kit/ })).toContainText('10 mg each');

    await page.reload();
    await page.getByRole('tab', { name: /Sealed/ }).click();
    await expect(page.getByRole('link', { name: /AI KPV kit/ })).toHaveCount(1);
  });

  test('proposes and confirms a schedule from chat', async ({ page }) => {
    await page.route('**/api/ai/propose-action', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'I will create this schedule for review.',
          action: {
            id: 'peppi-schedule-action-1',
            type: 'create_stack_from_protocol',
            payload: {
              name: 'AI BPC Schedule',
              description: 'BPC-157 daily protocol from chat.',
              peptides: [
                {
                  peptideId: 'bpc-157',
                  doseValue: 250,
                  doseUnit: 'mcg',
                  frequency: 'daily',
                  route: 'subq',
                  timing: 'Morning',
                  schedule: {
                    frequency: 'daily',
                    timesOfDay: ['08:00'],
                  },
                },
              ],
              startDate: '2026-06-15T08:00:00.000Z',
              durationDays: 28,
              status: 'planned',
              notes: 'Created from Peppi approval.',
            },
          },
        }),
      });
    });

    await page.goto('/more/ai-assistant');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('textbox', { name: 'Message Peppi' }).fill('BPC-157 250 mcg daily for 4 weeks at 8am.');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByText('I will create this schedule for review.')).toBeVisible();
    await expect(page.getByText('AI BPC Schedule')).toBeVisible();
    await expect(page.getByText('BPC-157', { exact: true })).toBeVisible();
    await expect(page.getByText('250 mcg · daily · SUBQ · Morning')).toBeVisible();

    await page.getByRole('button', { name: 'Confirm Schedule' }).click();
    await expect(page.getByText('Schedule saved.')).toBeVisible();

    await page.getByRole('link', { name: 'Stacks' }).click();
    await expect(page.getByText('AI BPC Schedule')).toBeVisible();
    await page.reload();
    await expect(page.getByText('AI BPC Schedule')).toBeVisible();
  });

  test('uses the Peppi action proposal response when available', async ({ page }) => {
    await page.route('**/api/ai/propose-action', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'I will add this Signal check-in.',
          action: {
            id: 'peppi-action-1',
            type: 'add_signal_check_in',
            payload: {
              checkedAt: '2026-06-15T08:00:00.000Z',
              energy: 8,
              sleepHours: 7,
              notes: 'from Peppi structured output',
            },
          },
        }),
      });
    });

    await page.goto('/more/ai-assistant');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('textbox', { name: 'Message Peppi' }).fill('Energy was 3, slept 2 hours, ignore local fallback.');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByText('Energy 8/10')).toBeVisible();
    await expect(page.getByText('Sleep 7 hr')).toBeVisible();
    await expect(page.getByText('from Peppi structured output')).toBeVisible();
  });

  test('proposes and confirms a Signal check-in from chat', async ({ page }) => {
    await page.goto('/more/ai-assistant');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('textbox', { name: 'Message Peppi' }).fill('Energy was 7, slept 6 hours, shoulder calm today.');
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
