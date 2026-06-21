import { writeFile } from 'node:fs/promises';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

interface ScheduledDoseFixtureOptions {
  fileName: string;
  stackName: string;
  schedules: Array<{
    id: string;
    logId: string;
    timeOfDay: string;
    dueAt: string;
  }>;
}

function localIsoForClock(hour: number, minute = 0) {
  return new Date(2026, 5, 21, hour, minute, 0, 0).toISOString();
}

function reviewButtonNameForIso(value: string) {
  return `Review ${new Date(value).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

async function importScheduledDoseFixture(
  page: Page,
  testInfo: TestInfo,
  { fileName, stackName, schedules }: ScheduledDoseFixtureOptions,
) {
  const exportPath = testInfo.outputPath(fileName);

  await writeFile(
    exportPath,
    JSON.stringify({
      schemaVersion: 4,
      exportedAt: '2026-06-21T00:00:00.000Z',
      data: {
        vials: [
          {
            id: 'vial-bpc-active',
            name: 'Peppi BPC active vial',
            peptideId: 'bpc-157',
            containerType: 'lyophilized-vial',
            dateAdded: '2026-06-21T00:00:00.000Z',
            source: 'Manual',
            lotNumber: '',
            mg: 5,
            totalAmount: { value: 5, unit: 'mg' },
            bacWaterMl: 1,
            reconstitutedDate: '2026-06-21T00:00:00.000Z',
            expirationDate: '2027-06-21T00:00:00.000Z',
            status: 'active',
          },
        ],
        inventoryBatches: [],
        doses: [],
        stacks: [
          {
            id: 'stack-bpc-peppi',
            name: stackName,
            description: '',
            peptides: [
              {
                id: 'stack-item-bpc',
                peptideId: 'bpc-157',
                doseValue: 250,
                doseUnit: 'mcg',
                frequency: schedules.length > 1 ? '2x daily' : 'daily',
                route: 'subq',
                timing: schedules.length > 1 ? 'Morning and evening' : 'Morning',
              },
            ],
            startDate: '2026-06-21T00:00:00.000Z',
            durationDays: 2,
            status: 'active',
            notes: '',
          },
        ],
        schedules: schedules.map((schedule) => ({
          id: schedule.id,
          stackId: 'stack-bpc-peppi',
          stackPeptideId: 'stack-item-bpc',
          peptideId: 'bpc-157',
          doseValue: 250,
          doseUnit: 'mcg',
          route: 'subq',
          recurrence: { frequency: 'daily', timesOfDay: [schedule.timeOfDay] },
          startDate: '2026-06-21T00:00:00.000Z',
          endDate: '2026-06-23T00:00:00.000Z',
          status: 'active',
        })),
        scheduleLogs: schedules.map((schedule) => ({
          id: schedule.logId,
          scheduleId: schedule.id,
          stackId: 'stack-bpc-peppi',
          stackPeptideId: 'stack-item-bpc',
          peptideId: 'bpc-157',
          dueAt: schedule.dueAt,
          status: 'pending',
        })),
        reconstitutionCalculations: [],
        signalCheckIns: [],
        userCompounds: [],
        settings: {
          hasSeenDisclaimer: true,
          hasCompletedOnboarding: true,
          userMode: 'researcher',
          biometricLock: false,
          darkMode: true,
        },
      },
    }),
  );

  await page.goto('/more/settings');
  await page.getByRole('button', { name: 'I Understand' }).click({ timeout: 5_000 }).catch(() => {});
  await page.getByLabel('Import Data File').setInputFiles(exportPath);
  await expect(page.getByRole('alertdialog', { name: 'Restore this PeptideOS backup?' })).toBeVisible();
  await page.getByRole('button', { name: 'Restore backup' }).click();
  await expect(page.getByRole('status')).toContainText('Data restored from backup');
}

test.describe('Peppi action approvals', () => {
  test('renders Peppi markdown guidance instead literal markers', async ({ page }) => {
    await page.route('**/api/ai/propose-action', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          message: [
            'Hi! I help you log few things:',
            '',
            '1. **Signal check-in** - Tell me energy level observations.',
            '2. **Create protocol** Describe compounds, doses, frequency, timing.',
            '3. **Add inventory** Record vials, kits, pens, bottles.',
            '',
            'What would you like to do?',
          ].join('\n'),
          action: null,
        }),
      });
    });

    await page.goto('/more/ai-assistant');
    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('textbox', { name: 'Message Peppi' }).fill('What can you help me log?');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByText('**Signal check-in**')).toHaveCount(0);
    await expect(page.locator('strong').filter({ hasText: 'Signal check-in' })).toBeVisible();
    await expect(page.getByText('Create protocol')).toBeVisible();
    await expect(page.getByText('What would you like to do?')).toBeVisible();
  });

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

  test('proposes scheduled dose confirmation locally without calling AI', async ({ page }, testInfo) => {
    await page.clock.setFixedTime(new Date(2026, 5, 21, 12, 0, 0, 0));
    let aiRequested = false;
    await page.route('**/api/ai/propose-action', async (route) => {
      aiRequested = true;
      await route.abort();
    });

    const dueAt8am = localIsoForClock(8);
    const review8am = reviewButtonNameForIso(dueAt8am);

    await importScheduledDoseFixture(page, testInfo, {
      fileName: 'peppi-single-scheduled-dose.json',
      stackName: 'Peppi Confirmation Stack',
      schedules: [
        {
          id: 'schedule-bpc-8am',
          logId: 'log-bpc-8am',
          timeOfDay: '08:00',
          dueAt: dueAt8am,
        },
      ],
    });

    await page.goto('/more/ai-assistant');
    await page.getByRole('textbox', { name: 'Message Peppi' }).fill('I took my BPC dose');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByText(/I found one pending scheduled dose/)).toBeVisible();
    await expect(page.getByLabel('Peppi scheduled dose review')).toBeVisible();
    await expect(page.getByText('Peppi Confirmation Stack')).toBeVisible();
    await expect(page.getByText('250 mcg · SUBQ')).toBeVisible();
    expect(aiRequested).toBe(false);

    await page.getByRole('button', { name: review8am }).click();
    const reviewDialog = page.getByRole('dialog', { name: 'Review scheduled dose' });
    await expect(reviewDialog).toBeVisible();
    await expect(reviewDialog.getByText(/No lot · 5 mg left/)).toBeVisible();
    await reviewDialog.getByRole('button', { name: /Suggested site Upper Left Abdomen/ }).click();
    await reviewDialog.getByRole('button', { name: 'Confirm dose' }).click();
    await expect(page.getByText(/Dose confirmed.*scheduled log/)).toBeVisible();

    await page.goto('/');
    await expect(page.getByText('Taken today', { exact: true }).first()).toBeVisible();
  });

  test('keeps ambiguous same-compound scheduled dose choices distinct', async ({ page }, testInfo) => {
    await page.clock.setFixedTime(new Date(2026, 5, 21, 12, 0, 0, 0));
    let aiRequested = false;
    await page.route('**/api/ai/propose-action', async (route) => {
      aiRequested = true;
      await route.abort();
    });

    const dueAt8am = localIsoForClock(8);
    const dueAt10pm = localIsoForClock(22);
    const review8am = reviewButtonNameForIso(dueAt8am);
    const review10pm = reviewButtonNameForIso(dueAt10pm);

    await importScheduledDoseFixture(page, testInfo, {
      fileName: 'peppi-twice-daily-scheduled-dose.json',
      stackName: 'Peppi Twice Daily Stack',
      schedules: [
        {
          id: 'schedule-bpc-8am',
          logId: 'log-bpc-8am',
          timeOfDay: '08:00',
          dueAt: dueAt8am,
        },
        {
          id: 'schedule-bpc-10pm',
          logId: 'log-bpc-10pm',
          timeOfDay: '22:00',
          dueAt: dueAt10pm,
        },
      ],
    });

    await page.goto('/more/ai-assistant');
    await page.getByRole('textbox', { name: 'Message Peppi' }).fill('I took my BPC dose');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByText(/I found multiple pending scheduled doses/)).toBeVisible();
    const reviewCard = page.getByLabel('Peppi scheduled dose review');
    await expect(reviewCard.getByText(/scheduled item.*completed/)).toBeVisible();
    await expect(reviewCard.getByRole('button', { name: review8am })).toBeVisible();
    await expect(reviewCard.getByRole('button', { name: review10pm })).toBeVisible();
    expect(aiRequested).toBe(false);

    await reviewCard.getByRole('button', { name: review10pm }).click();
    const reviewDialog = page.getByRole('dialog', { name: 'Review scheduled dose' });
    await expect(reviewDialog).toBeVisible();
    await expect(reviewDialog.getByText(new RegExp(review10pm.replace(/^Review\s+/, '')))).toBeVisible();
    await reviewDialog.getByRole('button', { name: /Suggested site Upper Left Abdomen/ }).click();
    await reviewDialog.getByRole('button', { name: 'Confirm dose' }).click();
    await expect(page.getByText(/Dose confirmed.*scheduled log/)).toBeVisible();

    await page.getByRole('textbox', { name: 'Message Peppi' }).fill('I took my BPC dose');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByText(/I found one pending scheduled dose/)).toBeVisible();
    const updatedReviewCard = page.getByLabel('Peppi scheduled dose review');
    await expect(updatedReviewCard.getByRole('button', { name: review8am })).toBeVisible();
    await expect(updatedReviewCard.getByRole('button', { name: review10pm })).toHaveCount(0);
  });

  test('proposes confirms sealed kit inventory from chat', async ({ page }) => {
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

  test('proposes confirms schedule from chat', async ({ page }) => {
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
    await page.getByRole('textbox', { name: 'Message Peppi' }).fill('BPC-157 250 mcg daily 4 weeks 8am.');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByText(/I will create.*schedule.*review/)).toBeVisible();
    await expect(page.getByLabel('Peppi protocol draft')).toBeVisible();
    await expect(page.getByText('Protocol draft')).toBeVisible();
    await expect(page.getByText('AI BPC Schedule')).toBeVisible();
    await expect(page.getByText('BPC-157', { exact: true })).toBeVisible();
    await expect(page.getByText('250 mcg')).toBeVisible();
    await expect(page.getByText('daily', { exact: true })).toBeVisible();
    await expect(page.getByText('SUBQ', { exact: true })).toBeVisible();
    await expect(page.getByText('Morning', { exact: true })).toBeVisible();
    await expect(page.getByText('28 days')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Edit in builder' })).toHaveAttribute(
      'href',
      '/stacks?compound=bpc-157&add=protocol&draft=peppi',
    );

    await page.getByRole('link', { name: 'Edit in builder' }).click();
    await expect(page.getByRole('heading', { name: 'Basics' })).toBeVisible();
    await expect(page.getByLabel('Stack Name')).toHaveValue('AI BPC Schedule');
    await expect(page.getByLabel('Duration (days)')).toHaveValue('28');
  });

  test('prefers structured AI Signal proposal over local fallback parsing', async ({ page }) => {
    await page.route('**/api/ai/propose-action', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'I will add Signal check-in.',
          action: {
            id: 'peppi-signal-action-remote',
            type: 'add_signal_check_in',
            payload: {
              checkedAt: '2026-06-21T12:00:00.000Z',
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

  test('proposes confirms Signal check-in from chat', async ({ page }) => {
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
