import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

interface TestVialOptions {
  name: string;
  compound: string;
  size?: string;
  status?: 'active' | 'sealed';
  dateAdded?: string;
  source?: string;
  lotNumber?: string;
}

export async function addTestVial(page: Page, options: TestVialOptions) {
  await page.goto('/more/inventory');

  await page.getByRole('button', { name: 'I Understand' }).click({ timeout: 5_000 }).catch(() => {});
  await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();

  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('textbox', { name: 'Vial name' }).fill(options.name);
  await page.getByRole('combobox').filter({ hasText: 'Select compound' }).click();
  await page.getByRole('option', { name: options.compound }).click();
  await page.getByLabel('Date added').fill(options.dateAdded ?? '2026-05-23');
  if (options.source) {
    await page.getByRole('textbox', { name: 'Source' }).fill(options.source);
  }
  if (options.lotNumber) {
    await page.getByRole('textbox', { name: 'Lot Number' }).fill(options.lotNumber);
  }
  await page.getByRole('spinbutton', { name: 'Vial size' }).fill(options.size ?? '5');

  if (options.status === 'active') {
    await page.getByRole('combobox', { name: 'Status' }).click();
    await page.getByRole('option', { name: 'Active (Reconstituted)' }).click();
  }

  await page.getByRole('button', { name: 'Add Vial' }).click();
}
