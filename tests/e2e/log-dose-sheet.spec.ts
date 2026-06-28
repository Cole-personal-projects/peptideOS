import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.describe('log dose sheet body picker', () => {
  test('supports compact body-map site selection and route filtering', async ({ page }) => {
    await page.goto('/stacks');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Quick actions' }).click();
    await page.getByRole('button', { name: 'Log Dose' }).click();

    await expect(page.getByRole('heading', { name: 'Log Dose' })).toBeVisible();
    await expect(page.locator('[data-body-map-ready="true"]')).toBeVisible();
    await expect(page.getByRole('img', { name: 'male front injection site map' })).toBeVisible();

    await page.getByRole('button', { name: 'Upper Left Abdomen' }).click();
    await expect(page.getByRole('status', { name: 'Selected site summary' })).toContainText('Upper Left Abdomen');

    await page.getByRole('tab', { name: 'IM' }).click();
    await expect(page.getByRole('button', { name: 'Upper Left Abdomen' })).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('button', { name: 'Left Anterior Deltoid' })).toBeVisible();
  });

  test('applies compound-aware dose preset chips without changing units', async ({ page }) => {
    await page.goto('/stacks');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Quick actions' }).click();
    await page.getByRole('button', { name: 'Log Dose' }).click();

    await page.getByRole('combobox').filter({ hasText: 'Select compound' }).click();
    await page.getByRole('option', { name: 'TB-500' }).click();

    await page.getByRole('button', { name: 'TB-500 2mg' }).click();
    await expect(page.getByPlaceholder('e.g., 250')).toHaveValue('2');
    await expect(page.getByRole('combobox').filter({ hasText: 'mg' })).toBeVisible();
  });

  test('logs IU-primary doses and renders the saved dose in IU', async ({ page }, testInfo) => {
    const exportPath = testInfo.outputPath('hgh-active-vial-data.json');
    await writeFile(exportPath, JSON.stringify({
      schemaVersion: 4,
      exportedAt: '2026-06-14T00:00:00.000Z',
      data: {
        vials: [
          {
            id: 'hgh-active-vial',
            name: 'hGH active vial',
            peptideId: 'hgh',
            containerType: 'lyophilized-vial',
            dateAdded: '2026-06-14T00:00:00.000Z',
            source: 'Pharmacy',
            lotNumber: 'HGH-2024-010',
            mg: 3.33,
            totalAmount: { value: 9.99, unit: 'iu' },
            bacWaterMl: 1,
            reconstitutedDate: '2026-06-14T00:00:00.000Z',
            expirationDate: '2026-07-12T00:00:00.000Z',
            status: 'active',
          },
        ],
        doses: [],
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

    await page.goto('/stacks');

    await page.getByRole('button', { name: 'Quick actions' }).click();
    await page.getByRole('button', { name: 'Log Dose' }).click();

    await page.getByRole('combobox').filter({ hasText: 'Select compound' }).click();
    await page.getByRole('option', { name: 'hGH (Somatropin)' }).click();
    await page.getByRole('combobox').filter({ hasText: 'Select vial' }).click();
await page.getByRole('option', { name: /HGH-2024-010/ }).click();

await page.getByRole('button', { name: 'hGH 2 IU (beginner)' }).click();
await expect(page.getByText('Draw volume')).toBeVisible();
await expect(page.getByText('0.20 mL')).toBeVisible();
await expect(page.getByText('20 U-100 units')).toBeVisible();
await page.getByRole('button', { name: 'Upper Left Abdomen' }).click();
    await page.getByRole('button', { name: 'Log Dose' }).click();

    await page.getByRole('link', { name: 'Log' }).click();
await expect(page.getByRole('heading', { name: 'Dose Log' })).toBeVisible();
await expect(page.getByText('hGH (Somatropin)').first()).toBeVisible();
await expect(page.getByText('2 IU').first()).toBeVisible();
});

test('completes a due protocol dose from quick actions', async ({ page }, testInfo) => {
await page.clock.setFixedTime(new Date('2026-06-24T10:30:00-07:00'));
const exportPath = testInfo.outputPath('quick-action-protocol-dose.json');
await writeFile(exportPath, JSON.stringify({
schemaVersion: 7,
exportedAt: '2026-06-24T17:30:00.000Z',
data: {
vials: [
{
id: 'vial-bpc-quick-log',
name: 'BPC quick log vial',
peptideId: 'bpc-157',
containerType: 'lyophilized-vial',
dateAdded: '2026-06-24',
source: 'Test inventory',
lotNumber: 'BPC-QUICK-001',
mg: 5,
totalAmount: { value: 5, unit: 'mg' },
bacWaterMl: 2,
reconstitutedDate: '2026-06-24',
expirationDate: '2026-12-24',
status: 'active',
},
],
inventoryBatches: [],
doses: [],
stacks: [
{
id: 'stack-quick-log',
name: 'BPC Quick Log Protocol',
description: '',
peptides: [
{
id: 'stack-item-bpc-quick',
peptideId: 'bpc-157',
doseValue: 250,
doseUnit: 'mcg',
frequency: 'daily',
route: 'subq',
timing: 'Morning',
},
],
startDate: '2026-06-24T00:00:00.000Z',
durationDays: 14,
status: 'active',
notes: '',
},
],
schedules: [
{
id: 'schedule-bpc-quick-log',
stackId: 'stack-quick-log',
stackPeptideId: 'stack-item-bpc-quick',
peptideId: 'bpc-157',
doseValue: 250,
doseUnit: 'mcg',
route: 'subq',
recurrence: { frequency: 'daily', timesOfDay: ['10:00'] },
startDate: '2026-06-24T00:00:00.000Z',
endDate: '2026-07-08T00:00:00.000Z',
status: 'active',
},
],
scheduleLogs: [
{
id: 'log-bpc-quick-complete',
scheduleId: 'schedule-bpc-quick-log',
stackId: 'stack-quick-log',
stackPeptideId: 'stack-item-bpc-quick',
peptideId: 'bpc-157',
dueAt: '2026-06-24T17:00:00.000Z',
status: 'pending',
},
],
reconstitutionCalculations: [],
signalCheckIns: [],
labReports: [],
labResults: [],
labImportAudits: [],
userCompounds: [],
settings: { hasSeenDisclaimer: true, hasCompletedOnboarding: true, userMode: 'researcher', biometricLock: false, darkMode: true },
},
}));

await page.goto('/more/settings');
await page.getByRole('button', { name: 'I Understand' }).click();
await page.getByLabel('Import Data File').setInputFiles(exportPath);
await expect(page.getByRole('alertdialog', { name: 'Restore this PeptideOS backup?' })).toBeVisible();
await page.getByRole('button', { name: 'Restore backup' }).click();
await expect(page.getByRole('status')).toContainText('Data restored from backup');

await page.goto('/stacks');
await page.getByRole('button', { name: 'Quick actions' }).click();
await page.getByRole('button', { name: 'Log Dose' }).click();
await page.getByRole('button', { name: /BPC-157/ }).click();
await expect(page.getByText('Completing this protocol dose')).toBeVisible();
await page.getByRole('button', { name: 'Upper Left Abdomen', exact: true }).click();
await page.getByRole('button', { name: 'Complete Scheduled Dose' }).click();

await expect(page.getByRole('button', { name: 'Complete' })).toHaveCount(0);
await page.goto('/log');
await expect(page.getByText('BPC-157').first()).toBeVisible();
await expect(page.getByText('250 mcg').first()).toBeVisible();
});
});
