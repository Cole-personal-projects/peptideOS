import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.describe('half-life visualizer', () => {
  test('models a source-backed compound before protocol logging', async ({ page }) => {
    await page.goto('/more/half-life');
    await page.getByRole('button', { name: 'I Understand' }).click();

    await expect(page.getByRole('heading', { name: 'Half-Life' })).toBeVisible();
    await expect(page.getByText('Estimated remaining timeline.')).toBeVisible();
    await expect(page.getByRole('img', { name: /estimated remaining amount curve/i })).toBeVisible();
    await expect(page.getByLabel('Compound picker')).toBeVisible();

    await page.getByLabel('Search compounds').fill('tirz');
await page.getByLabel('Compound picker').click();
await page.getByRole('option', { name: /Tirzepatide/ }).click();
    await page.getByLabel('Dose amount').fill('2.5');
    await page.getByLabel('Doses to model').fill('20');
    await page.getByRole('button', { name: 'Every 2d' }).click();
    await page.getByRole('button', { name: '30d' }).click();

    await expect(page.getByRole('heading', { name: 'Tirzepatide' })).toBeVisible();
    await expect(page.getByText('16 doses')).toBeVisible();
    await expect(page.getByText('Estimated remaining amount · 30 days')).toBeVisible();

    await page.getByLabel('Search compounds').fill('');
    await page.getByLabel('Compound picker').click();
    await page.getByRole('option', { name: /hGH|Somatropin/ }).click();
    await page.getByLabel('Dose unit').click();
    await expect(page.getByRole('option', { name: 'IU' })).toBeVisible();
  });

  test('loads an active protocol into the modeler', async ({ page }, testInfo) => {
    const exportPath = testInfo.outputPath('half-life-active-protocol.json');
    await writeFile(exportPath, JSON.stringify({
      schemaVersion: 7,
      exportedAt: '2026-06-30T12:00:00.000Z',
      data: {
        vials: [],
        doses: [],
        stacks: [
          {
            id: 'stack-half-life-protocol',
            name: 'Half-Life Protocol',
            description: '',
            peptides: [
              {
                id: 'stack-item-tirzepatide-half-life',
                peptideId: 'tirzepatide',
                doseValue: 2.5,
                doseUnit: 'mg',
                frequency: 'weekly',
                route: 'subq',
                timing: 'Monday morning',
                schedule: { frequency: 'weekly', timesOfDay: ['08:00'], weekdays: [1] },
              },
            ],
            startDate: '2026-06-30T00:00:00.000Z',
            durationDays: 84,
            status: 'active',
            notes: '',
          },
        ],
        schedules: [],
        scheduleLogs: [],
        reconstitutionCalculations: [],
        userCompounds: [],
        settings: { hasSeenDisclaimer: true, hasCompletedOnboarding: true, userMode: 'researcher', biometricLock: false, darkMode: true },
      },
    }));

    await page.goto('/more/settings');
    await page.getByRole('button', { name: 'I Understand' }).click({ timeout: 5_000 }).catch(() => undefined);
    await page.getByLabel('Import Data File').setInputFiles(exportPath);
    await page.getByRole('button', { name: 'Restore backup' }).click();
    await expect(page.getByRole('status')).toContainText('Data restored from backup');

    await page.goto('/more/half-life');
    await page.getByLabel('Use active protocol').click();
    await page.getByRole('option', { name: /Half-Life Protocol · Tirzepatide · 2.5 mg/ }).click();

    await expect(page.getByRole('heading', { name: 'Tirzepatide' })).toBeVisible();
    await expect(page.getByLabel('Dose amount')).toHaveValue('2.5');
    await expect(page.getByLabel('Doses to model')).toHaveValue('12');
    await expect(page.getByText('Half-Life Protocol · 2.5 mg · 1x weekly')).toBeVisible();
    await expect(page.getByRole('img', { name: /Tirzepatide estimated remaining amount curve/i })).toBeVisible();
  });
});
