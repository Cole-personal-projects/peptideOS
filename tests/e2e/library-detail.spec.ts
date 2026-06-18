import { expect, test } from '@playwright/test';

test.describe('library detail pages', () => {
  test('supports beginner and researcher compound detail modes across the unified profile', async ({ page }) => {
    await page.goto('/library/bpc-157');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'BPC-157' })).toBeVisible();
    await expect(page.getByText('For research purposes only. This information is not medical advice.')).toBeVisible();

    await expect(page.getByText('A synthetic pentadecapeptide commonly tracked')).toBeVisible();
    await expect(page.getByText('BPC-157 is described in preclinical literature')).toHaveCount(0);

    await page.getByRole('switch', { name: 'Researcher mode' }).click();
    await expect(page.getByText('BPC-157 is described in preclinical literature')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Safety', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Storage' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Citations' })).toBeVisible();
    await expect(page.getByText('Stable Gastric Pentadecapeptide BPC 157 and Wound Healing')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Legal' })).toBeVisible();
    await expect(
      page.getByText('PeptideOS does not provide medical advice, diagnosis, or treatment.')
    ).toBeVisible();
  });

  test('preserves IU display on hGH compound detail pages', async ({ page }) => {
    await page.goto('/library/hgh-somatropin');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'hGH / Somatropin' })).toBeVisible();
    await expect(page.getByText('IU', { exact: true }).first()).toBeVisible();
  });

  test('surfaces pro-grade Retatrutide evidence without turning it into dosing advice', async ({ page }) => {
    await page.goto('/library/retatrutide');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Retatrutide' })).toBeVisible();
    await expect(page.getByText('Phase 3 Topline')).toBeVisible();
    await expect(page.getByText('Investigational', { exact: true })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Evidence details' })).toBeVisible();
    await expect(page.getByText('GLP-1 receptor', { exact: true })).toBeVisible();
    await expect(page.getByText('GIP receptor', { exact: true })).toBeVisible();
    await expect(page.getByText('glucagon receptor', { exact: true })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Field brief' })).toBeVisible();
    await expect(page.getByText('Why people care')).toBeVisible();
    await expect(page.getByText('push past the current GLP-1/GIP ceiling')).toBeVisible();
    await expect(page.getByText('What to verify')).toBeVisible();
    await expect(page.getByText('do not treat marketing names as identity proof')).toBeVisible();
    await expect(page.getByText('What to track')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Peppi prompts' })).toBeVisible();
    await expect(page.getByText('The clinical Retatrutide story is not a gray-market vial.')).toBeVisible();

    await expect(page.getByText('Published phase 2 data reported dose-related body-weight reductions')).toBeVisible();
    await expect(page.getByText('Source Backed')).toBeVisible();
    await expect(page.getByText('Trial Registry')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Practical tracking' })).toBeVisible();
    await expect(page.getByText('Track inventory by exact vial, kit, lot, source, and container state.').first()).toBeVisible();
    await expect(page.getByText('Log labeled doses or ask Peppi to build a schedule').first()).toBeVisible();
    await expect(page.getByText('No FDA-approved US prescribing label or consumer storage instructions.')).toBeVisible();

    await expect(page.getByText(/recommended dose|dose recommendation/i)).toHaveCount(0);
  });

  test('presents Retatrutide as dedicated pro reference sections', async ({ page }) => {
    await page.goto('/library/retatrutide');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Retatrutide' })).toBeVisible();

    for (const heading of ['Field brief', 'Evidence details', 'Practical tracking', 'Safety watch', 'Regulatory context', 'Citations']) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }

    await expect(page.getByText('Why people care')).toBeVisible();
    await expect(page.getByText('What to verify')).toBeVisible();
    await expect(page.getByText('What to track')).toBeVisible();
    await expect(page.getByText('Reality check')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Evidence details' })).toBeVisible();
    await expect(page.getByText('phase-2-randomized-controlled-trial')).toBeVisible();
    await expect(page.getByText('phase-3-program')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Practical tracking' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Peppi prompts' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Evidence and transparency' })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Safety watch' })).toBeVisible();
    await expect(page.getByText('Gastrointestinal adverse events were common in published phase 2 obesity data.')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Regulatory context' })).toBeVisible();
    await expect(page.getByText('Investigational in US')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Citations' })).toBeVisible();
    await expect(page.getByText('Triple-Hormone-Receptor Agonist Retatrutide for Obesity')).toBeVisible();
    await expect(page.getByText('ClinicalTrials.gov,').first()).toBeVisible();
  });

  test('shows full pro-profile context for high-value compounds after profile completion', async ({ page }) => {
    await page.goto('/library/hgh-somatropin');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'hGH / Somatropin' })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'At a glance' })).toBeVisible();
    await expect(page.getByText('Approved Label', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Prefilled', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Field brief' })).toBeVisible();
    await expect(page.getByText('label-backed hormone entry')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Evidence and transparency' })).toBeVisible();
    await expect(page.getByText('Full pro profile is not yet attached')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Regulatory context' })).toBeVisible();
  });

  test('renders actionable app guidance for profiled database-backed compounds', async ({ page }) => {
    await page.goto('/library/tirzepatide');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Tirzepatide' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Field brief' })).toBeVisible();
    await expect(page.getByText('dual-incretin benchmark')).toBeVisible();
    await expect(page.getByText('What you can do')).toBeVisible();
    await expect(page.getByText('Add the exact labeled container or pen to inventory')).toBeVisible();
    await expect(page.getByText('Build a schedule from user-confirmed label details', { exact: true })).toBeVisible();
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
    await expect(page.getByRole('heading', { name: 'Regulatory context' })).toBeVisible();
    await expect(page.getByText('DailyMed provides US label records for tirzepatide products').first()).toBeVisible();

    await page.goto('/library/mots-c');
    await expect(page.getByRole('heading', { name: 'MOTS-c' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Field brief' })).toBeVisible();
    await expect(page.getByText('Common vial amount presets: 5 mg, 10 mg.')).toBeVisible();
    await expect(page.getByText('BAC water calculator presets: 1 mL, 2 mL.')).toBeVisible();
    await expect(page.getByText('Reconstitution date, concentration, active vial status, and remaining inventory')).toBeVisible();
    await expect(page.getByText('Calculate MOTS-c concentration from vial amount and BAC water')).toBeVisible();
  });

  test('renders approved, reconstituted, and pro-profile compounds through the unified profile view', async ({ page }) => {
    await page.goto('/library/tirzepatide');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'At a glance' })).toBeVisible();
    await expect(page.getByText('Evidence', { exact: true })).toBeVisible();
    await expect(page.getByText('Approved Label', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Form', { exact: true })).toBeVisible();
    await expect(page.getByText('Prefilled', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Peppi prompts' })).toBeVisible();

    await page.goto('/library/bpc-157');
    await expect(page.getByRole('heading', { name: 'At a glance' })).toBeVisible();
    await expect(page.getByText('Reconstituted', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Inventory and math' })).toBeVisible();
    await expect(page.getByText('BAC water calculator presets: 1 mL, 2 mL.')).toBeVisible();

    await page.goto('/library/retatrutide');
    await expect(page.getByRole('heading', { name: 'At a glance' })).toBeVisible();
    await expect(page.getByText('Strong Human')).toBeVisible();
    await expect(page.getByText('Investigational', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Field brief' })).toBeVisible();
    await expect(page.getByText('push past the current GLP-1/GIP ceiling')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Why people care' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Regulatory context' })).toBeVisible();
    await expect(page.getByText('not FDA approved and investigational').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Reality check' })).toBeVisible();
    await expect(page.getByText('The clinical Retatrutide story is not a gray-market vial.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Evidence details' })).toBeVisible();
    await expect(page.getByText('phase-2-randomized-controlled-trial')).toBeVisible();
    await expect(page.getByRole('tablist')).toHaveCount(0);
  });

  test('turns library compounds into app actions with compound context', async ({ page }) => {
    await page.goto('/library/retatrutide');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Retatrutide' })).toBeVisible();

    await page.getByRole('link', { name: 'Add Retatrutide to inventory' }).click();
    await expect(page).toHaveURL(/\/more\/inventory\?compound=retatrutide&add=inventory/);
    await expect(page.getByRole('dialog', { name: 'Add Vial' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Compound' })).toHaveText('Retatrutide');

    await page.goto('/library/retatrutide');
    await page.getByRole('link', { name: 'Create Retatrutide protocol' }).click();
    await expect(page).toHaveURL(/\/stacks\?compound=retatrutide&add=protocol/);
    await expect(page.getByRole('dialog', { name: 'New Stack' })).toBeVisible();
    await expect(page.getByLabel('Stack Name')).toHaveValue('Retatrutide research plan');

    await page.goto('/library/retatrutide');
    await page.getByRole('link', { name: 'Ask Peppi about Retatrutide' }).click();
    await expect(page).toHaveURL(/\/more\/ai-assistant\?compound=retatrutide/);
    await expect(page.getByRole('textbox', { name: 'Message Peppi' })).toHaveValue('Help me understand Retatrutide and what I can track in PeptideOS.');

    await page.goto('/library/retatrutide');
    await page.getByRole('link', { name: 'Compare Retatrutide with related compounds' }).click();
    await expect(page).toHaveURL(/\/library\?compare=retatrutide/);
    await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();
    await expect(page.getByText('Comparing compounds related to Retatrutide')).toBeVisible();
  });

  test('opens the full reconstitution calculator from supported compound detail pages', async ({ page }) => {
    await page.goto('/library/bpc-157');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'BPC-157' })).toBeVisible();

    await page.getByRole('link', { name: 'Calculate BPC-157 reconstitution' }).click();

    await expect(page).toHaveURL(/\/more\/reconstitution\?compound=bpc-157$/);
    await expect(page.getByRole('heading', { name: 'Reconstitution Calculator' })).toBeVisible();
    await expect(page.getByRole('combobox').filter({ hasText: 'BPC-157' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
  });

  test('does not offer reconstitution actions for unsupported compound detail pages', async ({ page }) => {
    await page.goto('/library/retatrutide');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Retatrutide' })).toBeVisible();

    await expect(page.getByRole('link', { name: 'Calculate Retatrutide reconstitution' })).toHaveCount(0);
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

    await expect(page.getByRole('link', { name: 'Custom Focus Blend Cognitive' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('link', { name: 'Custom Focus Blend Cognitive' })).toBeVisible();

    await page.getByRole('link', { name: 'Custom Focus Blend Cognitive' }).click();
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
