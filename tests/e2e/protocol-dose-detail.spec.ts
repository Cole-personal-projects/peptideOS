import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.describe('protocol dose detail view', () => {
  test('opens read-only syringe units view from protocol compound card', async ({ page }, testInfo) => {
    const exportPath = testInfo.outputPath('protocol-dose-detail.json');
    await writeFile(exportPath, JSON.stringify(buildBackup({
      vials: [
        {
          id: 'vial-bpc-active',
          name: 'BPC active vial',
          peptideId: 'bpc-157',
          dateAdded: '2026-06-28',
          source: 'test',
          lotNumber: 'BPC-001',
          mg: 5,
          bacWaterMl: 2,
          reconstitutedDate: '2026-06-28',
          expirationDate: '2026-07-28',
          status: 'active',
        },
      ],
    })));

    await restoreBackup(page, exportPath);
    await page.goto('/stacks/stack-dose-detail');

    const compoundCard = page.getByRole('button', { name: 'Open dose view for BPC-157' });
    await expect(compoundCard.getByText('Draw ready')).toBeVisible();
    await expect(compoundCard.getByText(/10 U/)).toBeVisible();

    await compoundCard.click();

    const dialog = page.getByRole('dialog', { name: 'BPC-157' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('250 mcg', { exact: true })).toBeVisible();
    await expect(dialog.getByText('10 U', { exact: true })).toBeVisible();
    await expect(dialog.getByText('10 U-100 units')).toBeVisible();
    await expect(dialog.getByLabel('Syringe showing 10.0 units to draw')).toBeVisible();
  });

  test('returns from reconstitution setup and marks protocol dose draw ready', async ({ page }, testInfo) => {
    const exportPath = testInfo.outputPath('protocol-dose-detail-missing.json');
    await writeFile(exportPath, JSON.stringify(buildBackup({ vials: [] })));

    await restoreBackup(page, exportPath);
    await page.goto('/stacks/stack-dose-detail');

    const compoundCard = page.getByRole('button', { name: 'Open dose view for BPC-157' });
    await expect(compoundCard.getByText('Draw setup')).toBeVisible();
    await expect(compoundCard.getByText('Add reconstitution')).toBeVisible();

    await compoundCard.click();
    await expect(page.getByText('No reconstitution saved yet')).toBeVisible();
    await page.getByRole('link', { name: 'Open reconstitution' }).click();
    await expect(page).toHaveURL(/\/more\/reconstitution\?compound=bpc-157&doseValue=250&doseUnit=mcg&returnTo=%2Fstacks%2Fstack-dose-detail$/);

    await expect(page.getByRole('heading', { name: 'Reconstitution Calculator' })).toBeVisible();
    await expect(page.locator('input[value="250"]').first()).toBeVisible();
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(page).toHaveURL(/\/stacks\/stack-dose-detail$/);
    const readyCard = page.getByRole('button', { name: 'Open dose view for BPC-157' });
    await expect(readyCard.getByText('Draw ready')).toBeVisible();
    await expect(readyCard.getByText(/10 U/)).toBeVisible();
  });
});

async function restoreBackup(page: import('@playwright/test').Page, exportPath: string) {
  await page.goto('/more/settings');
  await page.getByRole('button', { name: 'I Understand' }).click().catch(() => {});
  await page.getByLabel('Import Data File').setInputFiles(exportPath);
  await expect(page.getByRole('alertdialog', { name: 'Restore this PeptideOS backup?' })).toBeVisible();
  await page.getByRole('button', { name: 'Restore backup' }).click();
  await expect(page.getByRole('status')).toContainText('Data restored');
}

function buildBackup(overrides: Record<string, unknown> = {}) {
  const now = '2026-06-28T12:00:00.000Z';

  return {
    schemaVersion: 1,
    exportedAt: now,
    data: {
      peptides: [],
      compounds: [],
      doses: [],
      vials: [],
      inventoryBatches: [],
      stacks: [
        {
          id: 'stack-dose-detail',
          name: 'Dose Detail Protocol',
          description: '',
          peptides: [
            {
              id: 'stack-item-bpc',
              peptideId: 'bpc-157',
              doseValue: 250,
              doseUnit: 'mcg',
              frequency: 'daily',
              route: 'subq',
              timing: 'Morning',
              schedule: { frequency: 'daily', timesOfDay: ['08:00'] },
            },
          ],
          startDate: '2026-06-28T00:00:00.000Z',
          durationDays: 30,
          status: 'active',
          notes: '',
        },
      ],
      schedules: [],
      scheduleLogs: [],
      reconstitutionCalculations: [],
      signalCheckIns: [],
      labReports: [],
      labResults: [],
      labImportAudits: [],
      userCompounds: [],
      settings: {
        hasSeenDisclaimer: true,
        hasCompletedOnboarding: true,
        userMode: 'researcher',
        biometricLock: false,
        darkMode: true,
      },
      ...overrides,
    },
  };
}
