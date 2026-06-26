import { NextResponse } from 'next/server';
import { z } from 'zod/v4';

const diagnosticSchema = z.object({
  event: z.string().min(1).max(80),
  level: z.enum(['info', 'warn', 'error']).default('info'),
  timestamp: z.string().max(40),
  sessionId: z.string().max(80),
  path: z.string().max(180),
  payload: z.record(z.string(), z.unknown()).default({}),
  context: z
    .object({
      online: z.boolean().optional(),
      visibility: z.string().max(40).optional(),
      viewport: z.string().max(40).optional(),
      serviceWorker: z.string().max(40).optional(),
    })
    .default({}),
});

export async function POST(request: Request) {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid diagnostics payload.' }, { status: 400 });
  }

  const parsed = diagnosticSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid diagnostics payload.' }, { status: 400 });
  }

  const event = {
    source: 'client',
    ...parsed.data,
    receivedAt: new Date().toISOString(),
  };

  const line = JSON.stringify(event);
  if (parsed.data.level === 'error') {
    console.error('client-diagnostic', line);
  } else if (parsed.data.level === 'warn') {
    console.warn('client-diagnostic', line);
  } else {
    console.info('client-diagnostic', line);
  }

  return new Response(null, { status: 204 });
}
