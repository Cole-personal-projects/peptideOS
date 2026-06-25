import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const publicPath = (...parts: string[]) => join(root, 'public', ...parts);

describe('PWA public assets', () => {
  test('manifest exposes install metadata and existing icons', () => {
    const manifest = JSON.parse(readFileSync(publicPath('manifest.json'), 'utf8')) as {
      name: string;
      short_name: string;
      display: string;
      start_url: string;
      icons: Array<{ src: string; sizes: string; type: string; purpose?: string }>;
    };

    expect(manifest.name).toBe('PeptideOS');
    expect(manifest.short_name).toBe('PeptideOS');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }),
      expect.objectContaining({ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }),
    ]));
    manifest.icons.forEach((icon) => {
      expect(existsSync(publicPath(icon.src.replace(/^\//, '')))).toBe(true);
    });
  });

  test('service worker has an offline navigation fallback', () => {
    const serviceWorker = readFileSync(publicPath('sw.js'), 'utf8');
    const offlinePage = readFileSync(publicPath('offline.html'), 'utf8');

expect(serviceWorker).toContain('/offline.html');
expect(serviceWorker).toContain('event.request.mode === \'navigate\'');
expect(serviceWorker).toContain('peptideos-shell-v3');
expect(serviceWorker).not.toContain("  '/',");
expect(serviceWorker).toContain("url.pathname.startsWith('/_next/')");
expect(serviceWorker).toContain("url.searchParams.has('_rsc')");
expect(serviceWorker).toContain("accept.includes('text/x-component')");
expect(offlinePage).toContain('PeptideOS');
    expect(offlinePage).toContain('offline');
    expect(offlinePage).toContain('stored locally');
  });
});
