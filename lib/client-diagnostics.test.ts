import { afterEach, describe, expect, test, vi } from 'vitest';

import { emitClientDiagnostic, getDiagnosticsSessionId, sanitizePath } from './client-diagnostics';

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;
const originalNavigator = globalThis.navigator;
const originalCrypto = globalThis.crypto;
const originalFetch = globalThis.fetch;

describe('client diagnostics', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setGlobal('window', originalWindow);
    setGlobal('document', originalDocument);
    setGlobal('navigator', originalNavigator);
    setGlobal('crypto', originalCrypto);
    setGlobal('fetch', originalFetch);
  });

  test('is a no-op outside the browser', () => {
    const fetchSpy = vi.fn();
    setGlobal('window', undefined);
    setGlobal('fetch', fetchSpy);

    emitClientDiagnostic('client error', { message: 'nothing to emit' }, 'error');

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('normalizes paths and redacts identifiers', () => {
    expect(sanitizePath('more/settings/123e4567-e89b-12d3-a456-426614174000?token=secret')).toBe(
      '/more/settings/:id?token=secret',
    );
    expect(sanitizePath('/labs/report/12345/details')).toBe('/labs/report/:id/details');
  });

  test('creates and reuses a diagnostics session id', () => {
    const storage = createSessionStorage();
    setGlobal('window', { sessionStorage: storage });
    setGlobal('crypto', { randomUUID: () => 'session-123' });

    expect(getDiagnosticsSessionId()).toBe('session-123');
    expect(getDiagnosticsSessionId()).toBe('session-123');
  });

  test('emits sanitized payloads with sendBeacon when available', async () => {
    const storage = createSessionStorage();
    const beacons: Blob[] = [];
    setBrowserGlobals({
      sessionStorage: storage,
      sendBeacon: (_url: string, body: Blob) => {
        beacons.push(body);
        return true;
      },
      serviceWorker: { controller: {} },
    });
    setGlobal('crypto', { randomUUID: () => 'session-abc' });
    const fetchSpy = vi.fn();
    setGlobal('fetch', fetchSpy);

    emitClientDiagnostic(
      'client error!',
      {
        email: 'person@example.com',
        ssn: '123-45-6789',
        account: '12345678901',
        nested: { 'bad key': 'ok' },
      },
      'warn',
    );

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(beacons).toHaveLength(1);
    const payload = JSON.parse(await beacons[0].text());
    expect(payload).toMatchObject({
      event: 'client_error_',
      level: 'warn',
      sessionId: 'session-abc',
      path: '/more/settings/:id',
      context: {
        online: true,
        visibility: 'visible',
        viewport: '430x873',
        serviceWorker: 'controlled',
      },
    });
    expect(payload.payload).toMatchObject({
      email: '[email]',
      ssn: '[ssn]',
      account: '[number]',
      nested: { bad_key: 'ok' },
    });
  });

  test('falls back to keepalive fetch when sendBeacon is unavailable', () => {
    const storage = createSessionStorage();
    setBrowserGlobals({ sessionStorage: storage, sendBeacon: undefined });
    setGlobal('crypto', { randomUUID: () => 'session-fetch' });
    const fetchSpy = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    setGlobal('fetch', fetchSpy);

    emitClientDiagnostic('route stalled', { count: 2 });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/client-diagnostics',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        keepalive: true,
      }),
    );
    const [, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit & { body: string }];
    const body = JSON.parse(init.body);
    expect(body.context.serviceWorker).toBe('unsupported');
  });
});

function setBrowserGlobals({
  sessionStorage,
  sendBeacon,
  serviceWorker,
}: {
  sessionStorage: StorageLike;
  sendBeacon?: ((url: string, body: Blob) => boolean) | undefined;
  serviceWorker?: { controller?: unknown };
}) {
  setGlobal('window', {
    location: { pathname: '/more/settings/123e4567-e89b-12d3-a456-426614174000' },
    innerWidth: 430,
    innerHeight: 873,
    sessionStorage,
  });
  setGlobal('document', { visibilityState: 'visible' });
  setGlobal('navigator', {
    onLine: true,
    sendBeacon,
    ...(serviceWorker ? { serviceWorker } : {}),
  });
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

function createSessionStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

function setGlobal(key: keyof typeof globalThis, value: unknown) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value,
  });
}
