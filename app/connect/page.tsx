'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { format, addDays } from 'date-fns';

type Preference = 'morning' | 'afternoon' | 'evening' | 'none';

interface Questionnaire {
  range: { start: string; end: string };
  sleep: { from: string; to: string } | null;
  preference: Preference | null;
}

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ');

function timeOptions(): string[] {
  const opts: string[] = [];
  for (let h = 0; h < 24; h++) {
    opts.push(`${String(h).padStart(2, '0')}:00`);
    opts.push(`${String(h).padStart(2, '0')}:30`);
  }
  return opts;
}

const TIME_OPTS = timeOptions();

function ConnectContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('room'); // present when joining an existing room

  const today = format(new Date(), 'yyyy-MM-dd');
  const twoWeeks = format(addDays(new Date(), 14), 'yyyy-MM-dd');

  const [step, setStep] = useState(1); // 1=range, 2=sleep, 3=pref, 4=connect
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [rangeStart, setRangeStart] = useState(today);
  const [rangeEnd, setRangeEnd] = useState(twoWeeks);
  const [sleepEnabled, setSleepEnabled] = useState(true);
  const [sleepFrom, setSleepFrom] = useState('23:00');
  const [sleepTo, setSleepTo] = useState('07:00');
  const [preference, setPreference] = useState<Preference | null>(null);
  const [launching, setLaunching] = useState(false);

  const handleOAuth = () => {
    setLaunching(true);
    const q: Questionnaire = {
      range: { start: rangeStart, end: rangeEnd },
      sleep: sleepEnabled ? { from: sleepFrom, to: sleepTo } : null,
      preference,
    };
    sessionStorage.setItem('aligned_questionnaire', JSON.stringify(q));
    // Tell /room/new whether to create or join
    sessionStorage.setItem(
      'aligned_room_action',
      roomCode ? `join:${roomCode.toUpperCase()}` : 'create'
    );

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
    const redirectUri = `${window.location.origin}/api/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'select_account consent',
      state: '/room/new',
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  const skipAll = () => {
    // Skip questionnaire, go straight to OAuth with defaults
    const q: Questionnaire = {
      range: { start: today, end: twoWeeks },
      sleep: null,
      preference: null,
    };
    sessionStorage.setItem('aligned_questionnaire', JSON.stringify(q));
    sessionStorage.setItem(
      'aligned_room_action',
      roomCode ? `join:${roomCode.toUpperCase()}` : 'create'
    );
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
    const redirectUri = `${window.location.origin}/api/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'select_account consent',
      state: '/room/new',
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  const stepCount = 4;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f0', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.06em', color: '#1a1a18' }}>aligned</span>
        {step === 1 && (
          <button onClick={skipAll} style={{ fontSize: 13, color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
            Skip all →
          </button>
        )}
        {step > 1 && step < 4 && (
          <button onClick={() => setStep(s => s - 1)} style={{ fontSize: 13, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>← Back</button>
        )}
      </div>

      {/* Step dots */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 20 }}>
        {Array.from({ length: stepCount }, (_, i) => (
          <div key={i} style={{ width: i + 1 === step ? 20 : 7, height: 7, borderRadius: 999, backgroundColor: i + 1 === step ? '#4a8000' : i + 1 < step ? '#4a8000' : '#d8d8d2', transition: 'all 0.2s' }} />
        ))}
      </div>

      {/* Step content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 24px 32px', maxWidth: 480, width: '100%', margin: '0 auto' }}>

        {/* ── Step 1: Date range ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <p style={{ fontSize: 11, color: '#4a8000', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Step 1 of 4</p>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a2e0a', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 8 }}>What window should we check?</h1>
            <p style={{ fontSize: 14, color: '#7a8a6a', marginBottom: 32, lineHeight: 1.6 }}>We'll look for mutual free time within this range.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => { setUseCustomRange(false); setRangeStart(today); setRangeEnd(twoWeeks); }}
                style={{ padding: '16px 20px', borderRadius: 14, border: `2px solid ${!useCustomRange ? '#4a8000' : '#e0e0d8'}`, background: !useCustomRange ? 'rgba(74,128,0,0.06)' : '#fff', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 22 }}>📅</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1a2e0a', marginBottom: 2 }}>Next 2 weeks</p>
                  <p style={{ fontSize: 12, color: '#888' }}>{format(new Date(), 'MMM d')} – {format(addDays(new Date(), 14), 'MMM d')}</p>
                </div>
                {!useCustomRange && <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', backgroundColor: '#4a8000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: 11 }}>✓</span></div>}
              </button>

              <button
                onClick={() => setUseCustomRange(true)}
                style={{ padding: '16px 20px', borderRadius: 14, border: `2px solid ${useCustomRange ? '#4a8000' : '#e0e0d8'}`, background: useCustomRange ? 'rgba(74,128,0,0.06)' : '#fff', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 22 }}>🗓️</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1a2e0a', marginBottom: 2 }}>Custom range</p>
                  <p style={{ fontSize: 12, color: '#888' }}>Pick specific start and end dates</p>
                </div>
                {useCustomRange && <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', backgroundColor: '#4a8000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: 11 }}>✓</span></div>}
              </button>

              {useCustomRange && (
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Start</label>
                    <input type="date" value={rangeStart} min={today} onChange={e => setRangeStart(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d8d8d2', fontSize: 14, backgroundColor: '#fff', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>End</label>
                    <input type="date" value={rangeEnd} min={rangeStart} onChange={e => setRangeEnd(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d8d8d2', fontSize: 14, backgroundColor: '#fff', boxSizing: 'border-box' }} />
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setStep(2)} style={{ marginTop: 40, width: '100%', backgroundColor: '#4a8000', color: '#fff', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              Continue
            </button>
            <button onClick={() => setStep(2)} style={{ marginTop: 10, width: '100%', background: 'none', color: '#aaa', border: 'none', fontSize: 13, cursor: 'pointer', padding: '8px' }}>
              Skip this step
            </button>
          </div>
        )}

        {/* ── Step 2: Sleep schedule ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <p style={{ fontSize: 11, color: '#4a8000', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Step 2 of 4</p>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a2e0a', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 8 }}>When do you sleep?</h1>
            <p style={{ fontSize: 14, color: '#7a8a6a', marginBottom: 32, lineHeight: 1.6 }}>We'll block these hours from your availability.</p>

            <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #e0e0d8' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sleepEnabled ? 20 : 0 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1a2e0a' }}>Block sleep hours</span>
                <button
                  onClick={() => setSleepEnabled(v => !v)}
                  style={{ width: 44, height: 26, borderRadius: 999, backgroundColor: sleepEnabled ? '#4a8000' : '#d8d8d2', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ position: 'absolute', top: 3, left: sleepEnabled ? 21 : 3, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </button>
              </div>

              {sleepEnabled && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6 }}>Bedtime</label>
                    <select value={sleepFrom} onChange={e => setSleepFrom(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d8d8d2', fontSize: 14, backgroundColor: '#fff', boxSizing: 'border-box' }}>
                      {TIME_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6 }}>Wake up</label>
                    <select value={sleepTo} onChange={e => setSleepTo(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d8d8d2', fontSize: 14, backgroundColor: '#fff', boxSizing: 'border-box' }}>
                      {TIME_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setStep(3)} style={{ marginTop: 40, width: '100%', backgroundColor: '#4a8000', color: '#fff', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              Continue
            </button>
            <button onClick={() => { setSleepEnabled(false); setStep(3); }} style={{ marginTop: 10, width: '100%', background: 'none', color: '#aaa', border: 'none', fontSize: 13, cursor: 'pointer', padding: '8px' }}>
              Skip this step
            </button>
          </div>
        )}

        {/* ── Step 3: Meeting preference ── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <p style={{ fontSize: 11, color: '#4a8000', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Step 3 of 4</p>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a2e0a', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 8 }}>When do you prefer to meet?</h1>
            <p style={{ fontSize: 14, color: '#7a8a6a', marginBottom: 32, lineHeight: 1.6 }}>We'll prioritize these windows when ranking free slots.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {([
                { value: 'morning', label: 'Morning', sub: '6 am – 12 pm', icon: '🌅' },
                { value: 'afternoon', label: 'Afternoon', sub: '12 pm – 6 pm', icon: '☀️' },
                { value: 'evening', label: 'Evening', sub: '6 pm – 10 pm', icon: '🌆' },
                { value: 'none', label: 'No preference', sub: 'Show all equally', icon: '🔀' },
              ] as { value: Preference; label: string; sub: string; icon: string }[]).map(({ value, label, sub, icon }) => (
                <button key={value} onClick={() => setPreference(value)}
                  style={{ padding: '16px 20px', borderRadius: 14, border: `2px solid ${preference === value ? '#4a8000' : '#e0e0d8'}`, background: preference === value ? 'rgba(74,128,0,0.06)' : '#fff', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1a2e0a', marginBottom: 1 }}>{label}</p>
                    <p style={{ fontSize: 12, color: '#888' }}>{sub}</p>
                  </div>
                  {preference === value && <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#4a8000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ color: '#fff', fontSize: 11 }}>✓</span></div>}
                </button>
              ))}
            </div>

            <button onClick={() => setStep(4)} style={{ marginTop: 40, width: '100%', backgroundColor: '#4a8000', color: '#fff', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              Continue
            </button>
            <button onClick={() => { setPreference(null); setStep(4); }} style={{ marginTop: 10, width: '100%', background: 'none', color: '#aaa', border: 'none', fontSize: 13, cursor: 'pointer', padding: '8px' }}>
              Skip this step
            </button>
          </div>
        )}

        {/* ── Step 4: Connect calendar ── */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <p style={{ fontSize: 11, color: '#4a8000', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Step 4 of 4</p>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a2e0a', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 8 }}>
              {roomCode ? 'Connect to join the room' : 'Connect your calendar'}
            </h1>
            <p style={{ fontSize: 14, color: '#7a8a6a', marginBottom: 12, lineHeight: 1.6 }}>
              {roomCode
                ? `You're joining room ${roomCode}. We'll read your calendar to find the best overlap.`
                : 'We read your events to find free windows. Event details never leave your device.'}
            </p>

            {/* Summary of choices */}
            <div style={{ backgroundColor: '#fff', borderRadius: 14, border: '1px solid #e0e0d8', padding: '14px 18px', marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#888' }}>Date range</span>
                <span style={{ color: '#1a2e0a', fontWeight: 500 }}>
                  {format(new Date(rangeStart + 'T12:00'), 'MMM d')} – {format(new Date(rangeEnd + 'T12:00'), 'MMM d')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#888' }}>Sleep hours</span>
                <span style={{ color: '#1a2e0a', fontWeight: 500 }}>
                  {sleepEnabled ? `${sleepFrom} – ${sleepTo}` : 'Not set'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#888' }}>Preference</span>
                <span style={{ color: '#1a2e0a', fontWeight: 500, textTransform: 'capitalize' }}>
                  {preference ?? 'None'}
                </span>
              </div>
            </div>

            <button onClick={handleOAuth} disabled={launching}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#4a8000', color: '#fff', borderRadius: 14, padding: '18px', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: launching ? 0.7 : 1 }}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {launching ? 'Redirecting...' : 'Continue with Google'}
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#bbb', marginTop: 14 }}>
              Read-only access · No event details stored · Free
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(74,128,0,0.3)', borderTopColor: '#4a8000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <ConnectContent />
    </Suspense>
  );
}
