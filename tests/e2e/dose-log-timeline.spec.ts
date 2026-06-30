import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.describe('dose log timeline', () => {
  test.describe.configure({ mode: 'serial' });

  test('opens the actual log dose sheet from the log action URL', async ({ page }) => {
    await page.goto('/log?action=log');
    const disclaimerButton = page.getByRole('button', { name: 'I Understand' });
    if (await disclaimerButton.isVisible().catch(() => false)) await disclaimerButton.click();

    await expect(page.getByRole('dialog', { name: 'Log Dose' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log Dose' })).toBeVisible();
  });

  test('completes a due scheduled dose from the calendar log screen', async ({ page }, testInfo) => {
    const now = new Date();
    const dueAt = now.toISOString();
    const exportPath = testInfo.outputPath('dose-log-complete-scheduled.json');
    await writeFile(exportPath, JSON.stringify({
      schemaVersion: 4,
      exportedAt: dueAt,
      data: {
        vials: [
          {
            id: 'vial-bpc-log-screen',
            name: 'BPC log screen vial',
            peptideId: 'bpc-157',
            containerType: 'lyophilized-vial',
            dateAdded: dueAt,
            source: 'Test',
            lotNumber: 'BPC-LOG-001',
            mg: 5,
            totalAmount: { value: 5, unit: 'mg' },
            bacWaterMl: 2,
            reconstitutedDate: dueAt,
            expirationDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
          },
        ],
        doses: [],
        stacks: [
          {
            id: 'stack-log-screen',
            name: 'Log Screen Protocol',
            description: '',
            peptides: [
              {
                id: 'stack-item-bpc-log-screen',
                peptideId: 'bpc-157',
                doseValue: 250,
                doseUnit: 'mcg',
                frequency: 'daily',
                route: 'subq',
                timing: 'Morning',
              },
            ],
            startDate: dueAt,
            durationDays: 14,
            status: 'active',
            notes: '',
          },
        ],
        schedules: [
          {
            id: 'schedule-bpc-log-screen',
            stackId: 'stack-log-screen',
            stackPeptideId: 'stack-item-bpc-log-screen',
            peptideId: 'bpc-157',
            doseValue: 250,
            doseUnit: 'mcg',
            route: 'subq',
            recurrence: { frequency: 'daily', timesOfDay: ['10:00'] },
            startDate: dueAt,
            endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
          },
        ],
        scheduleLogs: [
          {
            id: 'log-bpc-log-screen',
            scheduleId: 'schedule-bpc-log-screen',
            stackId: 'stack-log-screen',
            stackPeptideId: 'stack-item-bpc-log-screen',
            peptideId: 'bpc-157',
            dueAt,
            status: 'pending',
          },
        ],
        reconstitutionCalculations: [],
        userCompounds: [],
        settings: { hasSeenDisclaimer: true, hasCompletedOnboarding: true, userMode: 'beginner', biometricLock: false, darkMode: true },
      },
    }));

    await page.goto('/more/settings');
    await page.getByRole('button', { name: 'I Understand' }).click().catch(() => {});
    await page.getByLabel('Import Data File').setInputFiles(exportPath);
    await expect(page.getByRole('alertdialog', { name: 'Restore this PeptideOS backup?' })).toBeVisible();
    await page.getByRole('button', { name: 'Restore backup' }).click();
    await expect(page.getByRole('status')).toContainText('Data restored');

    await page.goto('/log');
    await page.getByRole('button', { name: 'Log BPC-157 scheduled dose' }).click();
    const dialog = page.getByRole('dialog', { name: 'Complete scheduled dose' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Upper Left Abdomen', exact: true }).click();
    await dialog.getByRole('button', { name: 'Complete dose' }).click();

    await expect(page.getByRole('button', { name: 'Log BPC-157 scheduled dose' })).toHaveCount(0);
    await expect(page.getByText('Completed').first()).toBeVisible();
  });

  test('shows day-grouped native-unit dose history with completion state', async ({ page }, testInfo) => {
    const exportPath = testInfo.outputPath('dose-log-timeline-data.json');
    await writeFile(exportPath, JSON.stringify({
      schemaVersion: 4,
      exportedAt: '2026-06-14T00:00:00.000Z',
      data: {
        vials: [],
        doses: [
          {
            id: 'dose-timeline-tb-complete',
            peptideId: 'tb-500',
            vialId: '',
            dateTime: '2026-06-14T09:00:00.000Z',
            doseValue: 2.5,
            doseUnit: 'mg',
            route: 'subq',
            site: 'abdomen-upper-left',
            notes: '',
            completed: true,
          },
          {
            id: 'dose-timeline-bpc-planned',
            peptideId: 'bpc-157',
            vialId: '',
            dateTime: '2026-06-14T20:00:00.000Z',
            doseValue: 250,
            doseUnit: 'mcg',
            route: 'subq',
            site: '',
            notes: '',
            completed: false,
          },
        ],
        stacks: [],
        schedules: [],
        scheduleLogs: [],
        reconstitutionCalculations: [],
        userCompounds: [],
        settings: {
          hasSeenDisclaimer: true,
          hasCompletedOnboarding: true,
          userMode: 'beginner',
          biometricLock: false,
          darkMode: true,
        },
      },
    }));

    await page.goto('/more/settings');
    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByLabel('Import Data File').setInputFiles(exportPath);
    await expect(page.getByRole('alertdialog', { name: 'Restore this PeptideOS backup?' })).toBeVisible();
    await page.getByRole('button', { name: 'Restore backup' }).click();
    await expect(page.getByRole('status')).toContainText('Data restored from backup');

    await page.goto('/log');
    await page.getByRole('tab', { name: 'List view' }).click();

    await expect(page.getByText('2.5 mg').first()).toBeVisible();
    await expect(page.getByText('250 mcg').first()).toBeVisible();
    await expect(page.getByText('Planned').first()).toBeVisible();
    await expect(page.getByText('Completed').first()).toBeVisible();
  });
});
