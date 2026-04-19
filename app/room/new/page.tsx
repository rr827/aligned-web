'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { loadToken } from '@/lib/auth';
import { fetchBusyBlocks, BusyBlock } from '@/lib/calendar';
import { encodePayload, AlignedPayload } from '@/lib/payload';
import { format, addDays, differenceInDays } from 'date-fns';

// This page handles post-OAuth room creation/joining.
// The /api/auth/google/callback redirects here (state=/room/new).
// It reads the questionnaire + action from sessionStorage, fetches calendar
// blocks, encodes the full V2 payload, then creates or joins a room.

export default function RoomNewPage() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const token = loadToken();
      if (!token) { router.replace('/connect'); return; }

      const qRaw = sessionStorage.getItem('aligned_questionnaire');
      const action = sessionStorage.getItem('aligned_room_action') ?? 'create';
      sessionStorage.removeItem('aligned_questionnaire');
      sessionStorage.removeItem('aligned_room_action');

      const q = qRaw ? JSON.parse(qRaw) : null;
      const range: { start: string; end: string } = q?.range ?? {
        start: format(new Date(), 'yyyy-MM-dd'),
        end: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
      };

      // Calculate how many days ahead to fetch
      const daysAhead = Math.max(
        14,
        differenceInDays(new Date(range.end + 'T23:59'), new Date()) + 1
      );

      let blocks: BusyBlock[];
      try {
        blocks = await fetchBusyBlocks(token, daysAhead);
      } catch {
        blocks = [];
      }

      const payload: AlignedPayload = {
        range,
        sleep: q?.sleep ?? null,
        preference: q?.preference ?? null,
        blocks,
      };

      const encoded = encodePayload(payload);

      if (action.startsWith('join:')) {
        const code = action.slice(5);
        const res = await fetch('/api/room/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, payload: encoded }),
        });
        if (res.ok) {
          const { room } = await res.json();
          // Store which participant index we are
          localStorage.setItem(`room_${code}`, String(room.participants.length - 1));
          router.replace(`/room/${code}`);
        } else {
          router.replace(`/room/${code}?error=join_failed`);
        }
      } else {
        // Create new room
        const res = await fetch('/api/room/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: encoded }),
        });
        if (res.ok) {
          const { code } = await res.json();
          localStorage.setItem(`room_${code}`, '0');
          router.replace(`/room/${code}`);
        } else {
          router.replace('/connect?error=room_failed');
        }
      }
    })();
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: 36, height: 36, border: '2px solid rgba(74,128,0,0.3)', borderTopColor: '#4a8000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 14, color: '#7a8a6a' }}>Setting up your room…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
