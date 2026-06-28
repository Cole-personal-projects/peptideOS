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
  const config = getSupabaseServerConfig();
  const serviceClient = createSupabaseServerClient();
  const secret = getBetaCookieSecret();

  if (!config.configured || !serviceClient || !secret) {
    return redirectToBeta(request, { ok: false, reason: 'not_configured' });
  }

  let body: RedeemRequest;
  try {
    body = redeemSchema.parse(await readRedeemRequest(request));
  } catch {
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
    return redirectToBeta(request, { ok: false, reason: 'server_error' }, next);
  }

  const payload = data as BetaRedemptionResult;
  if (!payload.ok) {
    return redirectToBeta(request, { ...payload, message: betaRedemptionMessage(payload) }, next);
  }

  const url = new URL(next, request.url);
  const response = NextResponse.redirect(url, 303);
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
