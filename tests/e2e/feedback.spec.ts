import { expect, test } from '@playwright/test';

test.describe('beta feedback', () => {
  test('opens from More and submits structured feedback', async ({ page }) => {
    await page.route('**/api/feedback', async (route) => {
      const request = route.request();
      const body = request.postDataJSON() as {
        category?: string;
        severity?: string;
        summary?: string;
        details?: string;
        includeDiagnostics?: boolean;
        diagnostics?: { appVersion?: string; route?: string };
      };

      expect(body).toMatchObject({
        category: 'bug',
        severity: 'major',
        summary: 'Bottom nav tap stalls',
        details: 'The More screen accepts taps but the selected screen does not open.',
        includeDiagnostics: true,
      });
      expect(body.diagnostics).toMatchObject({ appVersion: '0.4', route: '/more/feedback' });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, stored: true, issueUrl: 'https://github.com/example/repo/issues/123', message: 'Feedback sent.' }),
      });
    });

    await page.goto('/more');
    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('link', { name: /Send Feedback/ }).click();

    await expect(page).toHaveURL(/\/more\/feedback$/);
    await expect(page.getByRole('heading', { name: 'Help shape the beta' })).toBeVisible();

    await page.getByLabel('Severity').click();
    await page.getByRole('option', { name: 'Major' }).click();
    await page.getByLabel('Short summary').fill('Bottom nav tap stalls');
    await page.getByLabel('What happened?').fill('The More screen accepts taps but the selected screen does not open.');
    await page.getByRole('button', { name: 'Send Feedback' }).click();

    await expect(page.getByText('Feedback sent.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'View issue' })).toHaveAttribute('href', 'https://github.com/example/repo/issues/123');
  });
});
