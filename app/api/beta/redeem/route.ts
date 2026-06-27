import { NextResponse } from 'next/server';
import { z } from 'zod/v4';

import { betaRedemptionMessage, normalizeInviteCode, type BetaRedemptionResult } from '@/lib/beta-access';
import { createSupabaseServerClient, createSupabaseTokenVerifier, getSupabaseServerConfig } from '@/lib/supabase-server';

export const runtime = 'nodejs';

const redeemSchema = z.object({
  inviteCode: z.string().min(4).max(80),
});

export async function POST(request: Request) {
  const config = getSupabaseServerConfig();
  if (!config.configured) {
    return NextResponse.json(
      { ok: false, message: 'Beta access is not configured on this deployment.' },
      { status: 503 },
    );
  }

  const accessToken = parseBearerToken(request.headers.get('authorization'));
  if (!accessToken) {
    return NextResponse.json({ ok: false, message: 'Sign in before redeeming beta access.' }, { status: 401 });
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

  const verifier = createSupabaseTokenVerifier(accessToken);
  const serviceClient = createSupabaseServerClient();
  if (!verifier || !serviceClient) {
    return NextResponse.json({ ok: false, message: 'Beta access is not configured on this deployment.' }, { status: 503 });
  }

  const { data: userData, error: userError } = await verifier.auth.getUser(accessToken);
  const user = userData.user;
  if (userError || !user?.id || !user.email) {
    return NextResponse.json({ ok: false, message: 'Your sign-in expired. Sign in again.' }, { status: 401 });
  }

  const { data, error } = await serviceClient.rpc('redeem_beta_invite', {
    invite_code: normalizeInviteCode(body.inviteCode),
    redeemer_user_id: user.id,
    redeemer_email: user.email,
  });

  if (error) {
    console.error('beta invite redemption failed', error);
    return NextResponse.json({ ok: false, message: 'Could not redeem beta access right now.' }, { status: 500 });
  }

  const result = data as BetaRedemptionResult;
  const status = result.ok ? 200 : result.reason === 'invalid_request' ? 400 : 422;
  return NextResponse.json({ ...result, message: betaRedemptionMessage(result) }, { status });
}

function parseBearerToken(header: string | null) {
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}
