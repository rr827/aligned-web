import { BusyBlock } from './calendar';

export function encodeAvailability(blocks: BusyBlock[]): string {
  const compressed = blocks.map((b) => [
    Math.floor(new Date(b.start).getTime() / 1000),
    Math.floor(new Date(b.end).getTime() / 1000),
  ]);

  const json = JSON.stringify(compressed);
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodeAvailability(encoded: string): BusyBlock[] {
  try {
    const base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(encoded.length + ((4 - (encoded.length % 4)) % 4), '=');

    const compressed: number[][] = JSON.parse(atob(base64));

    return compressed.map(([startSec, endSec]) => ({
      start: new Date(startSec * 1000).toISOString(),
      end: new Date(endSec * 1000).toISOString(),
    }));
  } catch {
    return [];
  }
}

export function buildShareLink(blocks: BusyBlock[]): string {
  const payload = encodeAvailability(blocks);
  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://getaligned.app';
  return `${base}/overlap?data=${payload}`;
}

export function parseShareLink(url: string): BusyBlock[] | null {
  try {
    const data = new URL(url).searchParams.get('data');
    if (!data) return null;
    return decodeAvailability(data);
  } catch {
    return null;
  }
}
