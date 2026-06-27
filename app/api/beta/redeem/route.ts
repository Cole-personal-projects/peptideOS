import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod/v4';

import { betaRedemptionMessage, normalizeInviteCode, type BetaRedemptionResult } from '@/lib/beta-access';
import {
  BETA_SESSION_COOKIE,
  createBetaSessionCookie,
  getBetaSessionMaxAgeSeconds,
  verifyBetaSessionCookie,
} from '@/lib/beta-session';
import { createSupabaseServerClient, getServerSecret, getSupabaseServerConfig } from '@/lib/supabase-server';

export const runtime = 'nodejs';

const redeemSchema = z.object({
  email: z.email(),
  inviteCode: z.string().min(4).max(80),
});

export async function GET() {
  const secret = getServerSecret();
  const cookieStore = await cookies();
  const session = secret ? verifyBetaSessionCookie(cookieStore.get(BETA_SESSION_COOKIE)?.value, secret) : null;

  return NextResponse.json({
    ok: Boolean(session),
    email: session?.email ?? null,
    entitlement: session?.entitlement ?? null,
  });
}

export async function POST(request: Request) {
  const config = getSupabaseServerConfig();
  if (!config.configured) {
    return NextResponse.json(
      { ok: false, message: 'Beta access is not configured on this deployment.' },
      { status: 503 },
    );
  }

  let body: z.infer<typeof redeemSchema>;
  try {
    body = redeemSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { ok: false, reason: 'invalid_request', message: betaRedemptionMessage({ ok: false, reason: 'invalid_request' }) },
      { status: 400 },
    );
  }

  const serviceClient = createSupabaseServerClient();
  const secret = getServerSecret();
  if (!serviceClient || !secret) {
    return NextResponse.json({ ok: false, message: 'Beta access is not configured on this deployment.' }, { status: 503 });
  }

  const email = body.email.trim().toLowerCase();
  const { data, error } = await serviceClient.rpc('redeem_beta_invite_by_email', {
    invite_code: normalizeInviteCode(body.inviteCode),
    redeemer_email: email,
  });

  if (error) {
    return NextResponse.json({ ok: false, message: 'Could not unlock beta access right now.' }, { status: 500 });
  }

  const payload = data as BetaRedemptionResult;
  const response = NextResponse.json({ ...payload, message: betaRedemptionMessage(payload) }, { status: payload.ok ? 200 : 400 });

  if (payload.ok) {
    response.cookies.set({
      name: BETA_SESSION_COOKIE,
      value: createBetaSessionCookie(email, secret),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: getBetaSessionMaxAgeSeconds(),
    });
  }

  return response;
}
