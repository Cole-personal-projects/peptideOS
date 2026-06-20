import { expect, test, type Page } from '@playwright/test';

async function chooseAddCompoundOption(page: Page, name: string, optionName: string) {
  const dialog = page.getByRole('dialog', { name: 'Add compound' });
  await dialog.getByRole('combobox', { name }).click();
  await page.getByRole('option', { name: optionName }).click();
}

async function openProfileDrawer(page: Page, name: string) {
  await page.getByRole('button', { name: new RegExp(name) }).click();
}

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
    await openProfileDrawer(page, 'Citations');
    await expect(page.getByText('Stable Gastric Pentadecapeptide BPC 157 and Wound Healing')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Legal' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Open compound guide for BPC-157' })).toBeVisible();
  });

  test('preserves IU display on hGH compound detail pages', async ({ page }) => {
    await page.goto('/library/hgh-somatropin');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'hGH / Somatropin' })).toBeVisible();
    await expect(page.getByText('IU', { exact: true }).first()).toBeVisible();
  });

  test('keeps compound facts prominent and places verbose guidance in drawers', async ({ page }) => {
    await page.goto('/library/tirzepatide');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Tirzepatide' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'At a glance' })).toBeVisible();
    await expect(page.getByText('Approved Label', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('SUBQ', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('MG', { exact: true }).first()).toBeVisible();

    const atAGlanceBox = await page.getByRole('heading', { name: 'At a glance' }).boundingBox();
    const addInventoryBox = await page.getByRole('link', { name: 'Add Tirzepatide to inventory' }).boundingBox();
    expect(atAGlanceBox?.y).toBeLessThan(addInventoryBox?.y ?? 0);

    await expect(page.getByRole('button', { name: /What you can do/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Peppi prompts/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Inventory and math/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Open compound guide for Tirzepatide' })).toBeVisible();

    await page.getByRole('link', { name: 'Open compound guide for Tirzepatide' }).click();
    await expect(page).toHaveURL(/\/more\/compound-guide\?compound=tirzepatide/);
    await expect(page.getByText('Workflow reference')).toBeVisible();
    await expect(page.getByText('Peppi', { exact: true })).toBeVisible();
  });

  test('surfaces pro-grade Retatrutide evidence without turning it into dosing advice', async ({ page }) => {
    await page.goto('/library/retatrutide');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Retatrutide' })).toBeVisible();
    await expect(page.getByText('Phase 3 Topline')).toBeVisible();
    await expect(page.getByText('Investigational', { exact: true })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Evidence details' })).toBeVisible();
    await openProfileDrawer(page, 'Evidence details');
    await expect(page.getByText('GLP-1 receptor', { exact: true })).toBeVisible();
    await expect(page.getByText('GIP receptor', { exact: true })).toBeVisible();
    await expect(page.getByText('glucagon receptor', { exact: true })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Field brief' })).toBeVisible();
    await openProfileDrawer(page, 'Field brief');
    await expect(page.getByText('Why people run this')).toBeVisible();
    await openProfileDrawer(page, 'Why people run this');
    await expect(page.getByText('push past the current GLP-1/GIP ceiling')).toBeVisible();
    await expect(page.getByText('What to verify')).toBeVisible();
    await openProfileDrawer(page, 'What to verify');
    await expect(page.getByText('do not treat marketing names as identity proof')).toBeVisible();
    await expect(page.getByText('What to track')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Peppi prompts' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Open compound guide for Retatrutide' })).toBeVisible();
    await openProfileDrawer(page, 'Reality check');
    await expect(page.getByText('The clinical Retatrutide story is not a gray-market vial.')).toBeVisible();

    await expect(page.getByText('Published phase 2 data reported dose-related body-weight reductions')).toBeVisible();
    await expect(page.getByText('Source Backed')).toBeVisible();
    await expect(page.getByText('Trial Registry')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Practical tracking' })).toHaveCount(0);
    await openProfileDrawer(page, 'Storage');
    await expect(page.getByText('No approved US product label defines consumer storage')).toBeVisible();

    await expect(page.getByText(/recommended dose|dose recommendation/i)).toHaveCount(0);
  });

  test('presents Retatrutide as dedicated pro reference sections', async ({ page }) => {
    await page.goto('/library/retatrutide');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Retatrutide' })).toBeVisible();

    for (const heading of ['Field brief', 'Evidence details', 'Safety watch', 'Regulatory context', 'Citations']) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }

    await expect(page.getByText('Why people run this')).toBeVisible();
    await expect(page.getByText('What to verify')).toBeVisible();
    await expect(page.getByText('What to track')).toBeVisible();
    await expect(page.getByText('Reality check')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Evidence details' })).toBeVisible();
    await openProfileDrawer(page, 'Evidence details');
    await expect(page.getByText('phase-2-randomized-controlled-trial')).toBeVisible();
    await expect(page.getByText('phase-3-program')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Practical tracking' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Peppi prompts' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Evidence and transparency' })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Safety watch' })).toBeVisible();
    await openProfileDrawer(page, 'Safety watch');
    await expect(page.getByText('Gastrointestinal adverse events were common in published phase 2 obesity data.')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Regulatory context' })).toBeVisible();
    await openProfileDrawer(page, 'Regulatory context');
    await expect(page.getByText('not FDA approved and investigational')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Citations' })).toBeVisible();
    await openProfileDrawer(page, 'Citations');
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
    await openProfileDrawer(page, 'Field brief');
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
    await openProfileDrawer(page, 'Field brief');
    await expect(page.getByText('dual-incretin benchmark')).toBeVisible();
    await expect(page.getByText('What you can do')).toHaveCount(0);
    await expect(page.getByText('What to verify')).toBeVisible();
    await openProfileDrawer(page, 'What to verify');
    await expect(page.getByText('Exact product name, labeled strength, container type, lot, expiration, source, and route from the physical label.')).toBeVisible();
    await expect(page.getByText('What to track')).toBeVisible();
    await openProfileDrawer(page, 'What to track');
    await expect(page.getByText('Schedule adherence, missed-dose notes, appetite/tolerability notes, weight trend notes, and user-entered dose changes over time.')).toBeVisible();
    await expect(page.getByText('Tracking domains')).toHaveCount(0);
    await expect(page.getByText('Peppi prompts')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Open compound guide for Tirzepatide' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Regulatory context' })).toBeVisible();
    await openProfileDrawer(page, 'Regulatory context');
    await expect(page.getByText('DailyMed provides US label records for tirzepatide products').first()).toBeVisible();

    await page.goto('/library/mots-c');
    await expect(page.getByRole('heading', { name: 'MOTS-c' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Field brief' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Inventory and math' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Calculate MOTS-c reconstitution' })).toBeVisible();
    await openProfileDrawer(page, 'What to track');
    await expect(page.getByText('Metabolic context notes, energy/exercise notes, sleep/recovery notes, appetite notes, and user-entered biomarker context.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Peppi prompts' })).toHaveCount(0);
  });

  test('renders approved, reconstituted, and pro-profile compounds through the unified profile view', async ({ page }) => {
    await page.goto('/library/tirzepatide');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'At a glance' })).toBeVisible();
    await expect(page.getByText('Evidence', { exact: true })).toBeVisible();
    await expect(page.getByText('Approved Label', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Form', { exact: true })).toBeVisible();
    await expect(page.getByText('Prefilled', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Peppi prompts' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Open compound guide for Tirzepatide' })).toBeVisible();

    await page.goto('/library/bpc-157');
    await expect(page.getByRole('heading', { name: 'At a glance' })).toBeVisible();
    await expect(page.getByText('Reconstituted', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Inventory and math' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Calculate BPC-157 reconstitution' })).toBeVisible();

    await page.goto('/library/retatrutide');
    await expect(page.getByRole('heading', { name: 'At a glance' })).toBeVisible();
    await expect(page.getByText('Strong Human')).toBeVisible();
    await expect(page.getByText('Investigational', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Field brief' })).toBeVisible();
    await openProfileDrawer(page, 'Field brief');
    await expect(page.getByText('push past the current GLP-1/GIP ceiling')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Why people run this' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Regulatory context' })).toBeVisible();
    await openProfileDrawer(page, 'Regulatory context');
    await expect(page.getByText('not FDA approved and investigational').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Reality check' })).toBeVisible();
    await openProfileDrawer(page, 'Reality check');
    await expect(page.getByText('The clinical Retatrutide story is not a gray-market vial.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Evidence details' })).toBeVisible();
    await openProfileDrawer(page, 'Evidence details');
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
    await chooseAddCompoundOption(page, 'Type', 'Small Molecule');
    await chooseAddCompoundOption(page, 'Category', 'Cognitive');
    await chooseAddCompoundOption(page, 'Route', 'ORAL');
    await chooseAddCompoundOption(page, 'Unit', 'MG');
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

  test('presents custom compound creation as a polished stable form', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto('/library');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Add compound' }).click();

    const dialog = page.getByRole('dialog', { name: 'Add compound' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByPlaceholder('e.g., KPV or custom blend')).toBeVisible();
    await expect(dialog.getByPlaceholder('What should PeptideOS show in the library card?')).toBeVisible();
    await expect(dialog.locator('select')).toHaveCount(0);
    await expect(dialog.locator('[data-slot="select-trigger"]')).toHaveCount(4);

    for (const name of ['Type', 'Category', 'Route', 'Unit']) {
      const control = dialog.getByRole('combobox', { name });
      await expect(control).toBeVisible();
      await expect(control.locator('svg')).toBeVisible();
    }

    const metrics = await dialog.evaluate((element) => {
      const controls = [...element.querySelectorAll('[data-field-control="true"]')].map((control) => {
        const rect = control.getBoundingClientRect();
        return { left: rect.left, right: rect.right, width: rect.width };
      });
      const type = element.querySelector('[data-field="type"] [data-field-control="true"]')?.getBoundingClientRect();
      const route = element.querySelector('[data-field="route"] [data-field-control="true"]')?.getBoundingClientRect();
      const category = element.querySelector('[data-field="category"] [data-field-control="true"]')?.getBoundingClientRect();
      const unit = element.querySelector('[data-field="unit"] [data-field-control="true"]')?.getBoundingClientRect();
      const dialogRect = element.getBoundingClientRect();

      return {
        dialogLeft: dialogRect.left,
        dialogRight: dialogRect.right,
        viewportWidth: document.documentElement.clientWidth,
        controls,
        alignedLeftColumn: type && route ? Math.abs(type.left - route.left) : 99,
        alignedRightColumn: category && unit ? Math.abs(category.left - unit.left) : 99,
        matchedColumnWidths: type && category ? Math.abs(type.width - category.width) : 99,
      };
    });

    expect(metrics.dialogLeft).toBeGreaterThanOrEqual(12);
    expect(metrics.dialogRight).toBeLessThanOrEqual(metrics.viewportWidth - 12);
    expect(metrics.alignedLeftColumn).toBeLessThanOrEqual(1);
    expect(metrics.alignedRightColumn).toBeLessThanOrEqual(1);
    expect(metrics.matchedColumnWidths).toBeLessThanOrEqual(1);

    for (const control of metrics.controls) {
      expect(control.left).toBeGreaterThanOrEqual(metrics.dialogLeft + 24);
      expect(control.right).toBeLessThanOrEqual(metrics.dialogRight - 24);
    }

    const topElementAtQuickAction = await page.evaluate(() => {
      const element = document.elementFromPoint(window.innerWidth / 2, window.innerHeight - 105);
      return element?.getAttribute('data-slot');
    });
    expect(topElementAtQuickAction).toBe('dialog-overlay');
  });
});
