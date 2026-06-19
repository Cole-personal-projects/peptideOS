import { expect, test } from '@playwright/test';

test.describe('PWA readiness', () => {
  test('registers a service worker and serves the offline fallback for uncached routes', async ({ page, context }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'I Understand' }).click();

    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller && registration.active) {
        await new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
          registration.active?.postMessage({ type: 'claim' });
          setTimeout(resolve, 1000);
        });
      }
    });
    await page.reload();
    await expect(page.evaluate(() => Boolean(navigator.serviceWorker.controller))).resolves.toBe(true);

    await context.setOffline(true);
    await page.goto('/uncached-offline-route');

    await expect(page.getByRole('heading', { name: 'PeptideOS is offline' })).toBeVisible();
    await expect(page.getByText(/stored locally/i)).toBeVisible();
  });

  test('reloads visited core shell routes while offline', async ({ page, context }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toBeVisible();

    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller && registration.active) {
        await new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
          registration.active?.postMessage({ type: 'claim' });
          setTimeout(resolve, 1000);
        });
      }
    });

    const coreRoutes = [
      { path: '/', heading: /Good (morning|afternoon|evening)/ },
      { path: '/library', heading: 'Library' },
      { path: '/stacks', heading: 'Stacks' },
      { path: '/log', heading: 'Dose Log' },
      { path: '/more', heading: 'More' },
    ];

    for (const route of coreRoutes) {
      await page.goto(route.path);
      await expect(page.getByRole('heading', { name: route.heading })).toBeVisible();
    }

    await context.setOffline(true);

    for (const route of coreRoutes) {
      await page.goto(route.path);
      await expect(page.getByRole('heading', { name: route.heading })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'PeptideOS is offline' })).toHaveCount(0);
    }
  });

  test('exposes installable manifest metadata', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.ok()).toBe(true);
    const manifest = await response?.json() as {
      name: string;
      short_name: string;
      start_url: string;
      display: string;
      orientation: string;
      theme_color: string;
      background_color: string;
      icons: Array<{ src: string; sizes: string; purpose?: string }>;
    };

    expect(manifest.name).toBe('PeptideOS');
    expect(manifest.short_name).toBe('PeptideOS');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.orientation).toBe('portrait');
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.icons.map((icon) => icon.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
    expect(manifest.icons.every((icon) => icon.purpose?.includes('maskable'))).toBe(true);
  });
});
