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

type RedeemRequest = z.infer<typeof redeemSchema>;

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
  const isFormPost = isFormRequest(request);
  const config = getSupabaseServerConfig();

  if (!config.configured) {
    return betaResponse(
      request,
      isFormPost,
      { ok: false, message: 'Beta access is not configured on this deployment.' },
      503,
    );
  }

  let body: RedeemRequest;
  try {
    body = redeemSchema.parse(await readRedeemRequest(request, isFormPost));
  } catch {
    return betaResponse(
      request,
      isFormPost,
      { ok: false, reason: 'invalid_request', message: betaRedemptionMessage({ ok: false, reason: 'invalid_request' }) },
      400,
    );
  }

  const serviceClient = createSupabaseServerClient();
  const secret = getServerSecret();
  if (!serviceClient || !secret) {
    return betaResponse(request, isFormPost, { ok: false, message: 'Beta access is not configured on this deployment.' }, 503);
  }

  const email = body.email.trim().toLowerCase();
  const { data, error } = await serviceClient.rpc('redeem_beta_invite_by_email', {
    invite_code: normalizeInviteCode(body.inviteCode),
    redeemer_email: email,
  });

  if (error) {
    return betaResponse(request, isFormPost, { ok: false, message: 'Could not unlock beta access right now.' }, 500);
  }

  const payload = data as BetaRedemptionResult;
  const response = betaResponse(
    request,
    isFormPost,
    { ...payload, message: betaRedemptionMessage(payload) },
    payload.ok ? 200 : 400,
  );

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

function isFormRequest(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  return contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data');
}

async function readRedeemRequest(request: Request, isFormPost: boolean) {
  if (!isFormPost) return request.json();

  const formData = await request.formData();
  return {
    email: String(formData.get('email') ?? ''),
    inviteCode: String(formData.get('inviteCode') ?? formData.get('betaKey') ?? ''),
  };
}

function betaResponse(
  request: Request,
  isFormPost: boolean,
  payload: BetaRedemptionResult,
  status: number,
) {
  if (!isFormPost) return NextResponse.json(payload, { status });

  const url = new URL('/', request.url);
  if (payload.ok) {
    url.searchParams.set('beta', 'confirmed');
  } else {
    url.searchParams.set('beta_error', payload.reason ?? 'failed');
  }

  return NextResponse.redirect(url, 303);
}
