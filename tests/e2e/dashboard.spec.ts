import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { addTestVial } from './helpers/inventory';

test.describe('dashboard polish', () => {
  test('shows briefing and adherence widgets after first-run accept', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'I Understand' }).click();

    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toBeVisible();
    await expect(page.getByText("Today's Briefing")).toBeVisible();
    await expect(page.getByText('Dose completion')).toBeVisible();
    await expect(page.getByText(/\d+\/\d+/).first()).toBeVisible();
    await expect(page.getByText('Pending', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Adherence')).toBeVisible();
    await expect(page.getByLabel('Recent adherence')).toBeVisible();
  });

  test('labels scheduled dose states and recent scheduled completions clearly', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-05-23T12:00:00-07:00'));
    await addTestVial(page, {
      name: 'BPC-157 active vial',
      compound: 'BPC-157',
      status: 'active',
    });

    await page.goto('/stacks');

    await page.getByRole('button', { name: 'New stack' }).click();
    await page.getByLabel('Stack Name').fill('Dashboard Actionability Stack');
    await page.getByLabel('Duration (days)').fill('2');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('checkbox', { name: 'BPC-157' }).check();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Create Stack' }).click();

    await page.getByRole('link', { name: /Dashboard Actionability Stack/ }).click();
    await page.getByRole('button', { name: 'Start' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();

await expect(page.getByText('Due today')).toBeVisible();
await expect(page.getByText('Pending action', { exact: true }).first()).toBeVisible();
await expect(page.getByText('Next action')).toBeVisible();
await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
await page.getByRole('button', { name: 'Due' }).click();
await expect(page.getByRole('link', { name: /BPC-157 250 mcg.*Dashboard Actionability Stack/ }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Coverage' }).click();
  await expect(page.getByText('No inventory coverage events right now')).toBeVisible();
await page.getByRole('button', { name: 'All' }).click();

await page.getByRole('button', { name: 'Complete' }).first().click();
    await page.getByRole('combobox').filter({ hasText: 'Select active vial' }).click();
    await page.getByRole('option', { name: /BPC-157 active vial/ }).click();
    await page.getByRole('button', { name: 'Upper Left Abdomen' }).click();
    await page.getByRole('button', { name: 'Complete dose' }).click();

    await expect(page.getByText('Taken today', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Completed scheduled dose')).toBeVisible();
  });

  test('gives a stack-building action when there are no due doses', async ({ page }, testInfo) => {
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
  await page.getByLabel('Import Data File').setInputFiles(exportPath);
  await expect(page.getByRole('alertdialog', { name: 'Restore this PeptideOS backup?' })).toBeVisible();
  await expect(page.getByText('0 stacks · 0 schedules · 0 due-dose records')).toBeVisible();
  await page.getByRole('button', { name: 'Restore backup' }).click();
  await expect(page.getByRole('status')).toContainText('Data restored from backup');

  await page.goto('/');

  await expect(page.getByText('No protocol activity yet')).toBeVisible();
  await expect(page.getByText('No doses due today')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Build a stack' })).toBeVisible();
});

test('formats IU-primary active inventory in native units without stack coverage warnings', async ({ page }, testInfo) => {
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
  await expect(page.getByText('Active Inventory')).toBeVisible();
  await expect(page.getByText('10 IU · HGH-LOT')).toBeVisible();
  await expect(page.getByText(/3\.3333333333333335mg/)).toHaveCount(0);
  await expect(page.getByText(/inventory coverage warning/)).toHaveCount(0);
});

test('shows estimated remaining amount preview for active PK-backed stacks', async ({ page }, testInfo) => {
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
    await page.getByLabel('Import Data File').setInputFiles(exportPath);
    await expect(page.getByRole('alertdialog', { name: 'Restore this PeptideOS backup?' })).toBeVisible();
    await page.getByRole('button', { name: 'Restore backup' }).click();
    await expect(page.getByRole('status')).toContainText('Data restored from backup');

    await page.goto('/');
    await expect(page.getByText('Estimated remaining amount')).toBeVisible();
    const estimatedPreview = page.getByRole('link', { name: /Semaglutide Dashboard Stack/ }).first();
    await expect(estimatedPreview).toContainText('Semaglutide');
    await expect(estimatedPreview).toContainText('half-life assumption 7 days');
    await expect(page.getByText('First-order estimate from logged completed doses. Not measured concentration or dose guidance.')).toBeVisible();
  });
});
