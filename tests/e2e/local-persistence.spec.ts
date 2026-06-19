import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.describe('local persistence', () => {
  test('persists onboarding completion across reloads', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toBeVisible();

    await page.reload();

    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Research Purposes Only' })).toHaveCount(0);
  });

  test('persists added vials across reloads', async ({ page }) => {
    await page.goto('/more/inventory');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByRole('textbox', { name: 'Vial name' }).fill('Reload Persisted GHK-Cu');
    await page.getByRole('combobox').filter({ hasText: 'Select compound' }).click();
    await page.getByRole('option', { name: 'GHK-Cu' }).click();
    await page.getByLabel('Date added').fill('2026-05-21');
    await page.getByRole('spinbutton', { name: 'Vial size' }).fill('50');
    await page.getByRole('button', { name: 'Add Vial' }).click();

    await page.getByRole('tab', { name: /Sealed/ }).click();
    await expect(page.getByRole('link', { name: /Reload Persisted GHK-Cu/ })).toBeVisible();

    await page.reload();
    await page.getByRole('tab', { name: /Sealed/ }).click();

    await expect(page.getByRole('link', { name: /Reload Persisted GHK-Cu/ })).toBeVisible();
  });

  test('persists saved reconstitution calculations across reloads', async ({ page }) => {
    await page.goto('/more/reconstitution');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Saved Calculations (1)')).toBeVisible();

    await page.reload();

    const savedCalculations = page.getByLabel('Saved reconstitution calculations');
    await expect(savedCalculations).toBeVisible();
    await expect(savedCalculations).toContainText('BPC-157');
    await expect(savedCalculations).toContainText('10.0 units');
  });

  test('clears local data from Settings and returns to first-run state', async ({ page }) => {
    await page.goto('/more/inventory');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByRole('textbox', { name: 'Vial name' }).fill('Clear Data GHK-Cu');
    await page.getByRole('combobox').filter({ hasText: 'Select compound' }).click();
    await page.getByRole('option', { name: 'GHK-Cu' }).click();
    await page.getByLabel('Date added').fill('2026-05-21');
    await page.getByRole('spinbutton', { name: 'Vial size' }).fill('50');
    await page.getByRole('button', { name: 'Add Vial' }).click();
    await page.getByRole('tab', { name: /Sealed/ }).click();
    await expect(page.getByRole('link', { name: /Clear Data GHK-Cu/ })).toBeVisible();

    await page.goto('/more/settings');
    await page.getByRole('button', { name: 'Clear All Data' }).click();
    await expect(page.getByRole('alertdialog', { name: 'Clear all local data?' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('alertdialog', { name: 'Clear all local data?' })).toHaveCount(0);

    await page.goto('/more/inventory');
    await page.getByRole('tab', { name: /Sealed/ }).click();
    await expect(page.getByRole('link', { name: /Clear Data GHK-Cu/ })).toBeVisible();

    await page.goto('/more/settings');
    await page.getByRole('button', { name: 'Clear All Data' }).click();
    await page.getByRole('button', { name: 'Clear local data' }).click();
    await expect(page.getByRole('heading', { name: 'Research Purposes Only' })).toBeVisible();
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Research Purposes Only' })).toBeVisible();
    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Research Purposes Only' })).toHaveCount(0);
    await page.goto('/more/inventory');
    await page.getByRole('tab', { name: /Sealed/ }).click();

    await expect(page.getByRole('link', { name: /Clear Data GHK-Cu/ })).toHaveCount(0);
  });

  test('restores local data from a PeptideOS export JSON file', async ({ page }, testInfo) => {
    const exportPath = testInfo.outputPath('peptideos-import.json');
    await writeFile(exportPath, JSON.stringify({
      schemaVersion: 2,
      exportedAt: '2026-05-23T00:00:00.000Z',
      data: {
        vials: [
          {
            id: 'vial-import-e2e',
            name: 'Imported Backup GHK-Cu',
            peptideId: 'ghk-cu',
            dateAdded: '2026-05-22',
            source: 'Backup',
            lotNumber: 'IMPORT-001',
            mg: 50,
            bacWaterMl: 0,
            reconstitutedDate: null,
            expirationDate: '2026-12-31',
            status: 'sealed',
          },
        ],
        doses: [],
        stacks: [],
        schedules: [],
        scheduleLogs: [],
        settings: {
          hasSeenDisclaimer: true,
          hasCompletedOnboarding: true,
          userMode: 'researcher',
          biometricLock: false,
          darkMode: true,
        },
      },
    }));

    await page.goto('/more/settings');
    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByText('Exports include your saved vials, doses, stacks, schedules, reconstitution calculations, signals, custom compounds, and settings. Bundled reference compounds stay in the app and are not duplicated in backups.')).toBeVisible();
    await expect(page.getByText('Imports replace local user data from a PeptideOS JSON backup. Bundled reference compounds remain app-owned.')).toBeVisible();
    await page.getByLabel('Import Data File').setInputFiles(exportPath);
    await expect(page.getByRole('status')).toContainText('Data restored from backup.');

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Research Purposes Only' })).toHaveCount(0);
    await page.goto('/more/inventory');
    await page.getByRole('tab', { name: /Sealed/ }).click();
    await expect(page.getByRole('link', { name: /Imported Backup GHK-Cu/ })).toBeVisible();
  });
});
