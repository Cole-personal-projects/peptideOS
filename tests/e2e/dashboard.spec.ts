import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.describe('dashboard workspace', () => {
test('shows Carbon Ember cockpit on root after first-run accept', async ({ page }) => {
await page.goto('/');
await expect(page.getByRole('alertdialog', { name: 'One-time setup' })).toBeVisible();
await page.getByRole('button', { name: 'I Understand' }).click();

await expect(page.getByRole('heading', { name: 'PeptideOS' })).toBeVisible();
await expect(page.getByText('A private protocol cockpit')).toHaveCount(0);
await expect(page.getByText('No data yet')).toBeVisible();
    await expect(page.getByText('Build your first protocol')).toBeVisible();
    await expect(page.getByText('Build your first protocol')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent activity' })).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();
    await page.getByRole('button', { name: 'Quick actions' }).click();
    await expect(page.getByRole('dialog', { name: 'Quick Actions' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Protocol' })).toBeVisible();
  });

  test('labels scheduled dose states clearly', async ({ page }, testInfo) => {
    await page.clock.setFixedTime(new Date('2026-05-23T12:00:00-07:00'));
    const exportPath = testInfo.outputPath('dashboard-scheduled-dose-data.json');
    await writeFile(exportPath, JSON.stringify({
      schemaVersion: 4,
      exportedAt: '2026-05-23T00:00:00.000Z',
      data: {
        vials: [],
        doses: [],
        stacks: [
          {
            id: 'stack-dashboard-actionability',
            name: 'Dashboard Actionability Stack',
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
              },
            ],
            startDate: '2026-05-23T00:00:00.000Z',
            durationDays: 2,
            status: 'active',
            notes: '',
          },
        ],
        schedules: [
          {
            id: 'schedule-bpc-dashboard',
            stackId: 'stack-dashboard-actionability',
            stackPeptideId: 'stack-item-bpc',
            peptideId: 'bpc-157',
            doseValue: 250,
            doseUnit: 'mcg',
            route: 'subq',
            recurrence: { frequency: 'daily', timesOfDay: ['10:00'] },
            startDate: '2026-05-23T00:00:00.000Z',
            endDate: '2026-05-25T00:00:00.000Z',
            status: 'active',
          },
        ],
        scheduleLogs: [
          {
            id: 'log-bpc-dashboard',
            scheduleId: 'schedule-bpc-dashboard',
            stackId: 'stack-dashboard-actionability',
            stackPeptideId: 'stack-item-bpc',
            peptideId: 'bpc-157',
            dueAt: '2026-05-23T10:00:00.000Z',
            status: 'pending',
          },
        ],
        reconstitutionCalculations: [],
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

    await page.goto('/');
    await expect(page.getByText('BPC-157').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Dashboard Actionability Stack Day/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Complete' }).first()).toBeVisible();
  });

  test('completes a due protocol dose from the dashboard card', async ({ page }, testInfo) => {
    await page.clock.setFixedTime(new Date('2026-06-24T10:30:00-07:00'));
    const exportPath = testInfo.outputPath('dashboard-protocol-dose-complete.json');
    await writeFile(exportPath, JSON.stringify({
      schemaVersion: 7,
      exportedAt: '2026-06-24T17:30:00.000Z',
      data: {
        vials: [
          {
            id: 'vial-bpc-active-dashboard-log',
            name: 'BPC active vial',
            peptideId: 'bpc-157',
            containerType: 'lyophilized-vial',
            dateAdded: '2026-06-24',
            source: 'Test inventory',
            lotNumber: 'BPC-LOG-001',
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
            id: 'stack-dashboard-log',
            name: 'BPC Log Protocol',
            description: '',
            peptides: [
              {
                id: 'stack-item-bpc-log',
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
            id: 'schedule-bpc-dashboard-log',
            stackId: 'stack-dashboard-log',
            stackPeptideId: 'stack-item-bpc-log',
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
            id: 'log-bpc-dashboard-complete',
            scheduleId: 'schedule-bpc-dashboard-log',
            stackId: 'stack-dashboard-log',
            stackPeptideId: 'stack-item-bpc-log',
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

    await page.goto('/');
    await page.getByRole('button', { name: 'Complete' }).first().click();
    await expect(page.getByRole('dialog', { name: 'Complete scheduled dose' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Complete dose' })).toBeVisible();
    await page.getByRole('button', { name: 'Upper Left Abdomen', exact: true }).click();
    await page.getByRole('button', { name: 'Complete dose' }).click();

    await expect(page.getByRole('dialog', { name: 'Complete scheduled dose' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Complete' })).toHaveCount(0);
    await page.goto('/log');
    await expect(page.getByText('BPC-157').first()).toBeVisible();
    await expect(page.getByText('250 mcg').first()).toBeVisible();
  });

  test('gives protocol-building action when no protocol data exists', async ({ page }, testInfo) => {
    const exportPath = testInfo.outputPath('empty-dashboard-data.json');
    await writeFile(exportPath, JSON.stringify({
      schemaVersion: 2,
      exportedAt: '2026-05-23T00:00:00.000Z',
      data: {
        vials: [],
        doses: [],
        stacks: [],
        schedules: [],
        scheduleLogs: [],
        compounds: [],
        settings: { hasSeenDisclaimer: true, hasCompletedOnboarding: true, userMode: 'researcher', biometricLock: false, darkMode: true },
      },
    }));

    await page.goto('/more/settings');
    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByLabel('Import Data File').setInputFiles(exportPath);
    await expect(page.getByRole('alertdialog', { name: 'Restore this PeptideOS backup?' })).toBeVisible();
    await page.getByRole('button', { name: 'Restore backup' }).click();
    await expect(page.getByRole('status')).toContainText('Data restored from backup');

    await page.goto('/');
    await expect(page.getByText('No data yet')).toBeVisible();
    await expect(page.getByText('Build your first protocol')).toBeVisible();
    await expect(page.getByRole('link', { name: /Build your first protocol/ })).toHaveAttribute('href', '/stacks?add=protocol');
  });

  test('summarizes IU-primary active inventory without raw mg conversion leakage', async ({ page }, testInfo) => {
    const exportPath = testInfo.outputPath('dashboard-hgh-inventory-data.json');
    await writeFile(exportPath, JSON.stringify({
      schemaVersion: 4,
      exportedAt: '2026-06-21T00:00:00.000Z',
      data: {
        vials: [
          {
            id: 'hgh-active-dashboard',
            name: 'hGH active vial',
            peptideId: 'hgh',
            containerType: 'lyophilized-vial',
            dateAdded: '2026-06-21T00:00:00.000Z',
            source: 'Manual',
            lotNumber: 'HGH-LOT',
            mg: 3.3333333333333335,
            totalAmount: { value: 10, unit: 'iu' },
            bacWaterMl: 1,
            reconstitutedDate: '2026-06-21T00:00:00.000Z',
            expirationDate: '2027-06-21T00:00:00.000Z',
            status: 'active',
          },
        ],
        doses: [],
        stacks: [],
        schedules: [],
        scheduleLogs: [],
        reconstitutionCalculations: [],
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

    await page.goto('/');
    await expect(page.getByRole('link', { name: /1 Stock Room/ })).toBeVisible();
    await expect(page.getByText('1').first()).toBeVisible();
    await expect(page.getByText(/3\.3333333333333335mg/)).toHaveCount(0);
    await expect(page.getByText(/inventory coverage warning/)).toHaveCount(0);
  });

  test('shows active PK-backed stack and recent completed dose in cockpit', async ({ page }, testInfo) => {
    await page.clock.setFixedTime(new Date('2026-06-08T12:00:00-07:00'));
    const exportPath = testInfo.outputPath('dashboard-estimated-remaining-data.json');
    await writeFile(exportPath, JSON.stringify({
      schemaVersion: 4,
      exportedAt: '2026-06-08T00:00:00.000Z',
      data: {
        vials: [],
        doses: [
          {
            id: 'dose-semaglutide-dashboard',
            peptideId: 'semaglutide',
            vialId: '',
            scheduleLogId: 'log-semaglutide-taken',
            dateTime: '2026-06-01T08:00:00.000Z',
            doseValue: 1,
            doseUnit: 'mg',
            route: 'subq',
            site: 'abdomen-upper-left',
            notes: '',
            completed: true,
          },
        ],
        stacks: [
          {
            id: 'stack-semaglutide-dashboard',
            name: 'Semaglutide Dashboard Stack',
            description: '',
            peptides: [
              {
                id: 'stack-item-semaglutide',
                peptideId: 'semaglutide',
                doseValue: 1,
                doseUnit: 'mg',
                frequency: 'weekly',
                route: 'subq',
                timing: 'Morning',
              },
            ],
            startDate: '2026-06-01T00:00:00.000Z',
            durationDays: 30,
            status: 'active',
            notes: '',
          },
        ],
        schedules: [
          {
            id: 'schedule-semaglutide-dashboard',
            stackId: 'stack-semaglutide-dashboard',
            stackPeptideId: 'stack-item-semaglutide',
            peptideId: 'semaglutide',
            doseValue: 1,
            doseUnit: 'mg',
            route: 'subq',
            recurrence: { frequency: 'weekly', timesOfDay: ['08:00'], weekdays: [1] },
            startDate: '2026-06-01T00:00:00.000Z',
            endDate: '2026-07-01T00:00:00.000Z',
            status: 'active',
          },
        ],
        scheduleLogs: [
          {
            id: 'log-semaglutide-taken',
            scheduleId: 'schedule-semaglutide-dashboard',
            stackId: 'stack-semaglutide-dashboard',
            stackPeptideId: 'stack-item-semaglutide',
            peptideId: 'semaglutide',
            dueAt: '2026-06-01T08:00:00.000Z',
            status: 'taken',
            doseId: 'dose-semaglutide-dashboard',
            takenAt: '2026-06-01T08:00:00.000Z',
          },
        ],
        reconstitutionCalculations: [],
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

    await page.goto('/');
    await expect(page.getByRole('link', { name: /Semaglutide Dashboard Stack/ })).toBeVisible();
    await expect(page.getByText('Semaglutide').first()).toBeVisible();
    await expect(page.getByText('1 mg').first()).toBeVisible();
  });
});
