import { NextResponse } from 'next/server';
import { z } from 'zod/v4';

import {
  betaRedemptionMessage,
  normalizeBetaEmail,
  normalizeInviteCode,
  type BetaRedemptionResult,
} from '@/lib/beta-access';
import { safeBetaNextPath } from '@/lib/beta-gate';
import { BETA_SESSION_COOKIE, createBetaSessionCookie, getBetaSessionMaxAgeSeconds } from '@/lib/beta-session';
import { createSupabaseServerClient, getSupabaseServerConfig } from '@/lib/supabase-server';

export const runtime = 'nodejs';

const redeemSchema = z.object({
  email: z.email(),
  inviteCode: z.string().min(4).max(80),
  next: z.string().optional(),
});

type RedeemRequest = z.infer<typeof redeemSchema>;

export async function POST(request: Request) {
  const wantsJson = request.headers.get('accept')?.includes('application/json') || request.headers.get('content-type')?.includes('application/json');
  const config = getSupabaseServerConfig();
  const serviceClient = createSupabaseServerClient();
  const secret = getBetaCookieSecret();

  if (!config.configured || !serviceClient || !secret) {
    if (wantsJson) {
      return NextResponse.json({ ok: false, reason: 'not_configured', message: betaRedemptionMessage({ ok: false, reason: 'not_configured' }) }, { status: 503 });
    }
    return redirectToBeta(request, { ok: false, reason: 'not_configured' });
  }

  let body: RedeemRequest;
  try {
    body = redeemSchema.parse(await readRedeemRequest(request));
  } catch {
    if (wantsJson) {
      return NextResponse.json({ ok: false, reason: 'invalid_request', message: betaRedemptionMessage({ ok: false, reason: 'invalid_request' }) }, { status: 400 });
    }
    return redirectToBeta(request, { ok: false, reason: 'invalid_request' });
  }

  const email = normalizeBetaEmail(body.email);
  const inviteCode = normalizeInviteCode(body.inviteCode);
  const next = safeBetaNextPath(body.next);

  const { data, error } = await serviceClient.rpc('redeem_beta_invite_by_email', {
    invite_code: inviteCode,
    redeemer_email: email,
  });

  if (error) {
    if (wantsJson) {
      return NextResponse.json({ ok: false, reason: 'server_error', message: betaRedemptionMessage({ ok: false, reason: 'server_error' }) }, { status: 500 });
    }
    return redirectToBeta(request, { ok: false, reason: 'server_error' }, next);
  }

  const payload = data as BetaRedemptionResult;
  if (!payload.ok) {
    if (wantsJson) {
      return NextResponse.json({ ...payload, message: betaRedemptionMessage(payload) }, { status: 403 });
    }
    return redirectToBeta(request, { ...payload, message: betaRedemptionMessage(payload) }, next);
  }

  const url = new URL(next, request.url);
  const response = wantsJson
    ? NextResponse.json({ ...payload, message: betaRedemptionMessage(payload), next })
    : NextResponse.redirect(url, 303);
  response.cookies.set({
    name: BETA_SESSION_COOKIE,
    value: await createBetaSessionCookie(email, secret),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: getBetaSessionMaxAgeSeconds(),
  });
  return response;
}

function getBetaCookieSecret() {
  return (
    process.env.BETA_GATE_COOKIE_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.ANTHROPIC_API_KEY?.trim() ||
    ''
  );
}

async function readRedeemRequest(request: Request) {
  if (request.headers.get('content-type')?.includes('application/json')) {
    const body = await request.json();
    return {
      email: String(body.email ?? ''),
      inviteCode: String(body.inviteCode ?? ''),
      next: String(body.next ?? '/'),
    };
  }

  const formData = await request.formData();
  return {
    email: String(formData.get('email') ?? ''),
    inviteCode: String(formData.get('inviteCode') ?? ''),
    next: String(formData.get('next') ?? '/'),
  };
}

function redirectToBeta(request: Request, payload: BetaRedemptionResult, next = '/') {
  const url = new URL('/beta', request.url);
  url.searchParams.set('error', payload.reason ?? 'server_error');
  url.searchParams.set('next', safeBetaNextPath(next));
  return NextResponse.redirect(url, 303);
}
