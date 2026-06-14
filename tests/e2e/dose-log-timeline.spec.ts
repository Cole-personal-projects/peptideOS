import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.describe('dose log timeline', () => {
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
    await expect(page.getByRole('status')).toContainText('Data restored from backup.');

    await page.goto('/log');
    await page.getByRole('tab', { name: 'List view' }).click();

    await expect(page.getByText('2.5 mg').first()).toBeVisible();
    await expect(page.getByText('250 mcg').first()).toBeVisible();
    await expect(page.getByText('Planned').first()).toBeVisible();
    await expect(page.getByText('Completed').first()).toBeVisible();
  });
});
