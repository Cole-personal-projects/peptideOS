import { expect, test } from '@playwright/test';

function createTextPdf(lines: string[]) {
  const escapedLines = lines
    .map((line) => `(${line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')}) Tj`)
    .join(' T*\n');
  const stream = `BT\n/F1 12 Tf\n50 760 Td\n14 TL\n${escapedLines}\nET`;
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(body));
    body += object;
  }
  const xrefOffset = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    body += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(body);
}

async function importQuestHormones(page: import('@playwright/test').Page, drawDate: string) {
  await page.getByRole('button', { name: 'Import' }).click();
  await page.getByRole('button', { name: 'CSV / Spreadsheet' }).click();
  await page.getByRole('button', { name: 'Quest hormones' }).click();
  await page.getByLabel('Draw date').fill(drawDate);
  await page.getByRole('button', { name: 'Review Data' }).click();
  await expect(page.getByLabel('Test name 1')).toHaveValue('Estradiol Sensitive');
  await expect(page.getByLabel('Assay method 1')).toHaveValue('LC/MS/MS');
  await page.getByRole('button', { name: 'Confirm Import' }).click();
  await expect(page.getByText('Import complete')).toBeVisible();
  await page.getByRole('button', { name: 'View Timeline' }).click();
}

test.describe('lab results workspace', () => {
  test('manual lab imports persist after reload', async ({ page }) => {
    await page.goto('/labs');
    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Import Lab Results' }).click();
    await page.getByRole('button', { name: 'Manual Entry' }).click();
    await page.getByLabel('Draw date').fill('2026-04-23');
    await page.getByLabel('Lab provider').fill('LabCorp');
    await page.getByLabel('Panel name').fill('Metabolic');
    await page.getByLabel('Manual test name').fill('Glucose');
    await page.getByLabel('Manual result value').fill('89');
    await page.getByLabel('Manual result unit').fill('mg/dL');
    await page.getByLabel('Manual reference range').fill('70-99');
    await page.getByLabel('Manual result flag').fill('normal');
    await page.getByRole('button', { name: 'Add row' }).click();
    await page.getByRole('button', { name: 'Review Data' }).click();
    await expect(page.getByLabel('Test name 1')).toHaveValue('Glucose');
    await page.getByRole('button', { name: 'Confirm Import' }).click();
    await expect(page.getByText('Import complete')).toBeVisible();
    await page.getByRole('button', { name: 'View Timeline' }).click();
    await expect(page.getByText('LabCorp')).toBeVisible();
    await expect(page.getByRole('button', { name: /Open lab report LabCorp Metabolic/ })).toBeVisible();
    await expect(page.getByText(/Apr 23, 2026 · 1 marker/)).toBeVisible();
    await expect(page.getByRole('link', { name: /Glucose/ })).toBeVisible();

    await page.reload();
    await expect(page.getByText('LabCorp')).toBeVisible();
    await expect(page.getByRole('button', { name: /Open lab report LabCorp Metabolic/ })).toBeVisible();
    await expect(page.getByText(/Apr 23, 2026 · 1 marker/)).toBeVisible();
    await expect(page.getByRole('link', { name: /Glucose/ })).toBeVisible();
  });

  test('imports labs and exposes timeline, detail, compare, trends, and redirect flows', async ({ page }) => {
    await page.goto('/more/lab-results');
    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page).toHaveURL(/\/labs/);
    await expect(page.getByRole('heading', { name: 'Lab Results' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Labs/ })).toHaveClass(/text-primary/);

    await expect(page.getByText('No lab results yet')).toBeVisible();
    await page.getByRole('button', { name: 'Import Lab Results' }).click();
    await expect(page.getByText('Step 1 of 4')).toBeVisible();
    await page.getByRole('button', { name: 'Upload PDF' }).click();
await expect(page.getByText('PDF import')).toBeVisible();
await expect(page.getByLabel('PDF import pipeline')).toBeVisible();
await expect(page.getByText('Need control?')).toBeVisible();
    await page.getByLabel('Draw date').fill('2026-06-01');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'quest-hormones.pdf',
      mimeType: 'application/pdf',
      buffer: createTextPdf([
        'Quest Diagnostics',
        'Estradiol Sensitive LC/MS/MS 22 pg/mL 8-35 normal',
        'Estradiol Immunoassay 31 pg/mL 8-35 normal',
        'Testosterone Total 640 ng/dL 250-1100 normal',
        'IGF-1 184 ng/mL 83-456 normal',
      ]),
    });
    await expect(page.getByText('Step 3 of 4')).toBeVisible();
    await expect(page.getByLabel('Test name 1')).toHaveValue('Estradiol Sensitive LC/MS/MS');
    await expect(page.getByLabel('Result value 1')).toHaveValue('22');
    await expect(page.getByLabel('Test name 4')).toHaveValue('IGF-1');
    await expect(page.getByLabel('Test name 5')).toBeHidden();
    await page.getByRole('button', { name: 'Confirm Import' }).click();
    await expect(page.getByText('Import complete')).toBeVisible();
    await page.getByRole('button', { name: 'View Timeline' }).click();

  await expect(page.getByText('Quest Diagnostics')).toBeVisible();
  await expect(page.getByText('Hormones')).toBeVisible();
  await expect(page.getByText('Flagged')).toBeVisible();
  await expect(page.getByText('Baseline')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Analyze' }).first()).toBeVisible();
  await page.route('**/api/ai/analyze-labs', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Peppi reviewed labs against PeptideOS records.', cards: [] }),
    });
  });
  await page.getByRole('button', { name: 'Analyze all' }).click();
  await expect(page.getByLabel('Peppi lab analysis loading')).toBeVisible();
  await expect(page.getByText('Peppi is reading your markers')).toBeVisible();
  await expect(page.getByText('Peppi reviewed labs against PeptideOS records.')).toBeVisible();
  await page.unroute('**/api/ai/analyze-labs');
  await page.getByRole('button', { name: /Open lab report Quest Diagnostics Hormones/ }).click();
  await expect(page).toHaveURL(/view=report/);
  await expect(page.getByText('Report detail')).toBeVisible();
  await expect(page.getByRole('link', { name: /Compare/ })).toBeVisible();
  await page.getByRole('link', { name: /Estradiol Sensitive/ }).click();
  await expect(page).toHaveURL(/view=detail/);
  await expect(page.getByText('Active protocol during test')).toBeVisible();
  await expect(page.getByText('Limited series')).toBeVisible();

  await page.getByRole('button', { name: 'Compare Tests' }).click();
  await expect(page.getByLabel('Older report')).toBeVisible();
  await expect(page.getByLabel('Newer report')).toBeVisible();
  await expect(page.getByText(/Estradiol Sensitive/).first()).toBeVisible();

    await importQuestHormones(page, '2026-07-01');
  await page.getByRole('button', { name: 'Compare' }).first().click();
  await expect(page).toHaveURL(/view=compare/);
  await expect(page.getByText('Clean deltas ready')).toBeVisible();
  await expect(page.getByText('Clean changes')).toBeVisible();
  await expect(page.getByText('Review').first()).toBeVisible();
  await expect(page.getByText('Testosterone Total', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/0%|\+/).first()).toBeVisible();

    await page.getByRole('button', { name: 'Trends' }).click();
    await expect(page.getByText('Key marker trends')).toBeVisible();
    await expect(page.getByText(/Assay or unit changed.*Compare cautiously/).first()).toBeVisible();
    await expect(page.getByText(/Not enough data|strong|moderate|weak/).first()).toBeVisible();
  });
});
