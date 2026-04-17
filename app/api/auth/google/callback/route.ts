import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!res.ok) {
      console.error('Token exchange failed:', await res.text());
      return NextResponse.redirect(new URL('/?error=token_exchange', request.url));
    }

    const data = await res.json();
    const { access_token, expires_in } = data;
    const expiry = Date.now() + expires_in * 1000;

    const state = searchParams.get('state');
    const returnTo = state && state.startsWith('/') ? state : '/home';
    const response = NextResponse.redirect(new URL(returnTo, request.url));

    const cookieOptions = {
      path: '/',
      maxAge: expires_in as number,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
    };

    response.cookies.set('aligned_token', access_token, cookieOptions);
    response.cookies.set('aligned_token_expiry', String(expiry), cookieOptions);

    return response;
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(new URL('/?error=server', request.url));
  }
}
