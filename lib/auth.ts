const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

const SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ');

const TOKEN_KEY = 'aligned_token';
const TOKEN_EXPIRY_KEY = 'aligned_token_expiry';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0`;
}

function getRedirectUri(): string {
  return `${window.location.origin}/auth/callback`;
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function startGoogleAuth(returnTo?: string): Promise<void> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  sessionStorage.setItem('pkce_verifier', codeVerifier);
  if (returnTo) sessionStorage.setItem('auth_return_to', returnTo);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'select_account consent',
    access_type: 'online',
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCode(
  code: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const codeVerifier = sessionStorage.getItem('pkce_verifier');
  if (!codeVerifier) throw new Error('No PKCE verifier found');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    }).toString(),
  });

  sessionStorage.removeItem('pkce_verifier');

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || `Token exchange failed: ${res.status}`);
  }

  const data = await res.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

export function saveToken(accessToken: string, expiresIn: number): void {
  const expiry = Date.now() + expiresIn * 1000;
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry));
}

export function loadToken(): string | null {
  // Check localStorage first
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (token && expiry) {
    if (Date.now() > Number(expiry) - 5 * 60 * 1000) {
      clearToken();
      return null;
    }
    return token;
  }

  // Fall back to cookies set by server-side OAuth callback
  const cookieToken = getCookie(TOKEN_KEY);
  const cookieExpiry = getCookie(TOKEN_EXPIRY_KEY);

  if (cookieToken && cookieExpiry) {
    // Sync to localStorage and clear cookies
    localStorage.setItem(TOKEN_KEY, cookieToken);
    localStorage.setItem(TOKEN_EXPIRY_KEY, cookieExpiry);
    deleteCookie(TOKEN_KEY);
    deleteCookie(TOKEN_EXPIRY_KEY);

    if (Date.now() > Number(cookieExpiry) - 5 * 60 * 1000) {
      clearToken();
      return null;
    }
    return cookieToken;
  }

  return null;
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

export function isConnected(): boolean {
  return loadToken() !== null;
}

export function getReturnTo(): string {
  const returnTo = sessionStorage.getItem('auth_return_to') || '/home';
  sessionStorage.removeItem('auth_return_to');
  return returnTo;
}
