"use client";

type DiagnosticLevel = 'info' | 'warn' | 'error';

interface DiagnosticBody {
  event: string;
  level: DiagnosticLevel;
  timestamp: string;
  sessionId: string;
  path: string;
  payload: Record<string, unknown>;
  context: {
    online: boolean;
    visibility: DocumentVisibilityState;
    viewport: string;
    serviceWorker: 'controlled' | 'unsupported' | 'uncontrolled';
  };
}

const SESSION_KEY = 'peptideos.diagnostics.sessionId';
const MAX_STRING_LENGTH = 500;

export function emitClientDiagnostic(
  event: string,
  payload: Record<string, unknown> = {},
  level: DiagnosticLevel = 'info',
) {
  if (typeof window === 'undefined') return;

  const body: DiagnosticBody = {
    event: sanitizeToken(event),
    level,
    timestamp: new Date().toISOString(),
    sessionId: getDiagnosticsSessionId(),
    path: sanitizePath(window.location.pathname),
    payload: sanitizePayload(payload),
    context: {
      online: navigator.onLine,
      visibility: document.visibilityState,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      serviceWorker: !('serviceWorker' in navigator)
        ? 'unsupported'
        : navigator.serviceWorker.controller
          ? 'controlled'
          : 'uncontrolled',
    },
  };

  const serialized = JSON.stringify(body);
  const blob = new Blob([serialized], { type: 'application/json' });

  if (navigator.sendBeacon?.('/api/client-diagnostics', blob)) return;

  void fetch('/api/client-diagnostics', {
    method: 'POST',
    body: serialized,
    headers: { 'content-type': 'application/json' },
    keepalive: true,
  }).catch(() => undefined);
}

export function getDiagnosticsSessionId() {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const next = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return 'session-unavailable';
  }
}

export function sanitizePath(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')
    .replace(/\/[0-9]{4,}(?=\/|$)/g, '/:id')
    .slice(0, 180);
}

function sanitizePayload(payload: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload).slice(0, 30)) {
    result[sanitizeToken(key)] = sanitizeValue(value);
  }
  return result;
}

function sanitizeValue(value: unknown): unknown {
  if (value == null || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
  if (typeof value === 'string') return sanitizeString(value);
  if (Array.isArray(value)) return value.slice(0, 10).map(sanitizeValue);
  if (typeof value === 'object') {
    const nested: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value).slice(0, 12)) {
      nested[sanitizeToken(key)] = sanitizeValue(nestedValue);
    }
    return nested;
  }
  return String(value).slice(0, MAX_STRING_LENGTH);
}

function sanitizeString(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, '[ssn]')
    .replace(/\b\d{10,}\b/g, '[number]')
    .slice(0, MAX_STRING_LENGTH);
}

function sanitizeToken(value: string) {
  return value.replace(/[^a-zA-Z0-9_.:-]/g, '_').slice(0, 80);
}
