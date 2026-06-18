import { expect, test } from '@playwright/test';

test.describe('library detail pages', () => {
  test('supports beginner and researcher compound detail modes across required tabs', async ({ page }) => {
    await page.goto('/library/bpc-157');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'BPC-157' })).toBeVisible();
    await expect(page.getByText('For research purposes only. This information is not medical advice.')).toBeVisible();

    await expect(page.getByText('A synthetic pentadecapeptide commonly tracked')).toBeVisible();
    await expect(page.getByText('BPC-157 is described in preclinical literature')).toHaveCount(0);

    await page.getByRole('switch', { name: 'Researcher mode' }).click();
    await expect(page.getByText('BPC-157 is described in preclinical literature')).toBeVisible();

    for (const tabName of ['Safety', 'Citations', 'Legal']) {
      await page.getByRole('tab', { name: tabName }).click();
      await expect(page.getByRole('tabpanel')).toBeVisible();
    }

    await page.getByRole('tab', { name: 'Citations' }).click();
    await expect(page.getByText('Stable Gastric Pentadecapeptide BPC 157 and Wound Healing')).toBeVisible();

    await page.getByRole('tab', { name: 'Legal' }).click();
    await expect(
      page.getByText('PeptideOS does not provide medical advice, diagnosis, or treatment.')
    ).toBeVisible();
  });

  test('preserves IU display on hGH compound detail pages', async ({ page }) => {
    await page.goto('/library/hgh-somatropin');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'hGH / Somatropin' })).toBeVisible();
    await expect(page.getByText('IU')).toBeVisible();
  });

  test('surfaces pro-grade Retatrutide evidence without turning it into dosing advice', async ({ page }) => {
    await page.goto('/library/retatrutide');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Retatrutide' })).toBeVisible();
    await expect(page.getByText('Phase 3 Topline')).toBeVisible();
    await expect(page.getByText('Investigational')).toBeVisible();

    await page.getByRole('tab', { name: 'Evidence' }).click();
    await expect(page.getByText('GLP-1 receptor', { exact: true })).toBeVisible();
    await expect(page.getByText('GIP receptor', { exact: true })).toBeVisible();
    await expect(page.getByText('glucagon receptor', { exact: true })).toBeVisible();

    await page.getByRole('tab', { name: 'Field Brief' }).click();
    await expect(page.getByText('Why people care')).toBeVisible();
    await expect(page.getByText('push past the current GLP-1/GIP ceiling')).toBeVisible();
    await expect(page.getByText('Verify before use')).toBeVisible();
    await expect(page.getByText('do not treat marketing names as identity proof')).toBeVisible();
    await expect(page.getByText('Track in PeptideOS')).toBeVisible();
    await expect(page.getByText('Ask Peppi', { exact: true })).toBeVisible();
    await expect(page.getByText('The clinical Retatrutide story is not a gray-market vial.')).toBeVisible();

    await page.getByRole('tab', { name: 'Evidence' }).click();
    await expect(page.getByText('Published phase 2 data reported dose-related body-weight reductions')).toBeVisible();
    await expect(page.getByText('Source Backed', { exact: true })).toBeVisible();
    await expect(page.getByText('Trial Registry', { exact: true })).toBeVisible();

    await page.getByRole('tab', { name: 'Tracking' }).click();
    await expect(page.getByText('Track inventory by exact vial, kit, lot, source, and container state.').first()).toBeVisible();
    await expect(page.getByText('Log labeled doses or ask Peppi to build a schedule').first()).toBeVisible();
    await expect(page.getByText('No FDA-approved US prescribing label or consumer storage instructions.')).toBeVisible();

    await expect(page.getByText(/recommended dose|dose recommendation/i)).toHaveCount(0);
  });

  test('presents Retatrutide as dedicated pro reference sections', async ({ page }) => {
    await page.goto('/library/retatrutide');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Retatrutide' })).toBeVisible();

    for (const tabName of ['Field Brief', 'Evidence', 'Tracking', 'Safety Watch', 'Status', 'Citations']) {
      await expect(page.getByRole('tab', { name: tabName })).toBeVisible();
    }

    await page.getByRole('tab', { name: 'Field Brief' }).click();
    await expect(page.getByText('Why people care')).toBeVisible();
    await expect(page.getByText('Verify before use')).toBeVisible();
    await expect(page.getByText('Track in PeptideOS')).toBeVisible();
    await expect(page.getByText('Reality check')).toBeVisible();

    await page.getByRole('tab', { name: 'Evidence' }).click();
    await expect(page.getByText('Evidence Snapshot')).toBeVisible();
    await expect(page.getByText('phase-2-randomized-controlled-trial')).toBeVisible();
    await expect(page.getByText('phase-3-program')).toBeVisible();

    await page.getByRole('tab', { name: 'Tracking' }).click();
    await expect(page.getByText('Practical Tracking Notes')).toBeVisible();
    await expect(page.getByText('Peppi can help')).toBeVisible();
    await expect(page.getByText('Evidence gaps')).toBeVisible();

    await page.getByRole('tab', { name: 'Safety Watch' }).click();
    await expect(page.getByText('Safety Watch')).toBeVisible();
    await expect(page.getByText('Gastrointestinal adverse events were common in published phase 2 obesity data.')).toBeVisible();

    await page.getByRole('tab', { name: 'Status' }).click();
    await expect(page.getByText('Regulatory Status')).toBeVisible();
    await expect(page.getByText('investigational in US')).toBeVisible();

    await page.getByRole('tab', { name: 'Citations' }).click();
    await expect(page.getByText('Triple-Hormone-Receptor Agonist Retatrutide for Obesity')).toBeVisible();
    await expect(page.getByText('ClinicalTrials.gov,').first()).toBeVisible();
  });

  test('shows pro-data priority context for high-value compounds waiting on full profiles', async ({ page }) => {
    await page.goto('/library/bpc-157');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'BPC-157' })).toBeVisible();

    await expect(page.getByText('Reference Intelligence')).toBeVisible();
    await expect(page.getByText('Pro data priority')).toBeVisible();
    await expect(page.getByText('Research Only')).toBeVisible();
    await expect(page.getByText('High user value')).toBeVisible();
    await expect(page.getByText('Protocol and inventory impact')).toBeVisible();
    await expect(page.getByText('Source-backed upgrade path')).toBeVisible();
  });

  test('renders actionable app guidance for database-backed compounds without full pro profiles', async ({ page }) => {
    await page.goto('/library/tirzepatide');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Tirzepatide' })).toBeVisible();
    await expect(page.getByText('What you can do')).toBeVisible();
    await expect(page.getByText('Add the exact labeled container or pen to inventory')).toBeVisible();
    await expect(page.getByText('Build a schedule from user-confirmed label details')).toBeVisible();
    await expect(page.getByText('What to verify')).toBeVisible();
    await expect(page.getByText('Container label, lot, expiration, strength, and route')).toBeVisible();
    await expect(page.getByText('What to track')).toBeVisible();
    await expect(page.getByText('Inventory depletion and active container status')).toBeVisible();
    await expect(page.getByText('Tracking domains')).toBeVisible();
    await expect(page.getByText('Metabolic trend notes', { exact: true })).toBeVisible();
    await expect(page.getByText('Appetite and tolerability notes', { exact: true })).toBeVisible();
    await expect(page.getByText('Peppi prompts')).toBeVisible();
    await expect(page.getByText('Add my labeled Tirzepatide container to inventory')).toBeVisible();
    await expect(page.getByText('Build a Tirzepatide schedule from my confirmed label details')).toBeVisible();
    await expect(page.getByText('Transparency')).toBeVisible();
    await expect(page.getByText('Full pro profile is not yet attached')).toBeVisible();

    await page.goto('/library/mots-c');
    await expect(page.getByRole('heading', { name: 'MOTS-c' })).toBeVisible();
    await expect(page.getByText('Common vial amount presets: 5 mg, 10 mg.')).toBeVisible();
    await expect(page.getByText('BAC water calculator presets: 1 mL, 2 mL.')).toBeVisible();
    await expect(page.getByText('Reconstitution date, concentration, active vial status, and remaining inventory')).toBeVisible();
    await expect(page.getByText('Calculate MOTS-c concentration from vial amount and BAC water')).toBeVisible();
  });

  test('creates, edits, persists, and deletes a custom compound', async ({ page }) => {
    await page.goto('/library');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Add compound' }).click();
    await page.getByLabel('Name').fill('Custom Focus Blend');
    await page.getByLabel('Type', { exact: true }).selectOption('small-molecule');
    await page.getByLabel('Category', { exact: true }).selectOption('cognitive');
    await page.getByLabel('Route', { exact: true }).selectOption('oral');
    await page.getByLabel('Unit', { exact: true }).selectOption('mg');
    await page.getByLabel('Summary').fill('Private focus tracking note.');
    await page.getByRole('button', { name: 'Save compound' }).click();

    await expect(page.getByRole('link', { name: /Custom Focus Blend/ })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('link', { name: /Custom Focus Blend/ })).toBeVisible();

    await page.getByRole('link', { name: /Custom Focus Blend/ }).click();
    await page.getByRole('button', { name: 'Edit compound' }).click();
    await page.getByLabel('Name').fill('Custom Focus Blend Edited');
    await page.getByLabel('Summary').fill('Edited private focus tracking note.');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByRole('heading', { name: 'Custom Focus Blend Edited' })).toBeVisible();
    await page.getByRole('button', { name: 'Edit compound' }).click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page).toHaveURL(/\/library$/);
    await expect(page.getByRole('link', { name: /Custom Focus Blend Edited/ })).toHaveCount(0);
  });
});
