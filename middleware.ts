import { NextRequest, NextResponse } from 'next/server';

import { getBetaCookieSecret, isApiPath, isBetaGateEnabled, isPublicBetaPath } from './lib/beta-gate';
import { BETA_SESSION_COOKIE, verifyBetaSessionCookie } from './lib/beta-session';

export async function middleware(request: NextRequest) {
  if (!isBetaGateEnabled()) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  if (isPublicBetaPath(pathname)) return NextResponse.next();

  const secret = getBetaCookieSecret();
  const session = secret
    ? await verifyBetaSessionCookie(request.cookies.get(BETA_SESSION_COOKIE)?.value, secret)
    : null;

  if (session) return NextResponse.next();

  if (isApiPath(pathname)) {
    return NextResponse.json({ error: 'Beta access required.' }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = '/beta';
  url.search = '';
  url.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
