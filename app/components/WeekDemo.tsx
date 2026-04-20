'use client';

// Animated demo of the week view drag-select interaction
// Used on the landing page hero

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const HOUR_LABELS = [
  { label: '6a', pct: 0 },
  { label: '9a', pct: 18.75 },
  { label: '12p', pct: 37.5 },
  { label: '3p', pct: 56.25 },
  { label: '6p', pct: 75 },
];

// Participant colors (green = P1, navy = P2)
const C1 = 'rgba(74,128,0,0.6)';
const C2 = 'rgba(28,52,97,0.7)';

// Busy blocks: { d: dayIdx, top: %, h: %, c: color }
// Time positions: 6am=0%, 9am=18.75%, 12pm=37.5%, 3pm=56.25%, 6pm=75%, 10pm=100%
// Each hour = 6.25%
const BUSY: { d: number; top: number; h: number; c: string }[] = [
  // Mon
  { d: 0, top: 12.5, h: 9.4, c: C1 },   // P1: 8–9:30am
  { d: 0, top: 37.5, h: 6.25, c: C2 },  // P2: 12–1pm
  // Tue
  { d: 1, top: 25, h: 12.5, c: C2 },    // P2: 10am–12pm
  { d: 1, top: 56.25, h: 6.25, c: C1 }, // P1: 3–4pm
  // Wed
  { d: 2, top: 12.5, h: 6.25, c: C1 },  // P1: 8–9am
  { d: 2, top: 43.75, h: 12.5, c: C2 }, // P2: 1–3pm
  // Thu
  { d: 3, top: 25, h: 12.5, c: C2 },    // P2: 10–12pm
  { d: 3, top: 62.5, h: 6.25, c: C1 },  // P1: 4–5pm
  // Fri
  { d: 4, top: 12.5, h: 6.25, c: C1 },  // P1: 8–9am
  { d: 4, top: 37.5, h: 6.25, c: C2 },  // P2: 12–1pm
  // Sat
  { d: 5, top: 50, h: 9.4, c: C1 },     // P1: 2–3:30pm
  // Sun: free
];

// Selection animates on Friday (d=4) from 9am (18.75%) to 3pm (56.25%)
const SEL_DAY = 4;
const SEL_TOP = 18.75;   // 9am
const SEL_HEIGHT = 37.5; // 9am → 3pm = 6hrs = 37.5%

const css = `
@keyframes aligned-sel-grow {
  0%, 12%   { top: ${SEL_TOP}%; height: 0%;        opacity: 0; }
  16%        { top: ${SEL_TOP}%; height: 0%;        opacity: 1; }
  52%        { top: ${SEL_TOP}%; height: ${SEL_HEIGHT}%; opacity: 1; }
  68%, 80%   { top: ${SEL_TOP}%; height: ${SEL_HEIGHT}%; opacity: 1; }
  92%, 100%  { top: ${SEL_TOP}%; height: ${SEL_HEIGHT}%; opacity: 0; }
}
@keyframes aligned-cursor {
  0%, 12%  { top: ${SEL_TOP}%;                          opacity: 0; }
  14%       { top: ${SEL_TOP}%;                          opacity: 1; }
  52%       { top: ${SEL_TOP + SEL_HEIGHT}%;             opacity: 1; }
  68%       { top: ${SEL_TOP + SEL_HEIGHT}%;             opacity: 1; }
  72%       { top: ${SEL_TOP + SEL_HEIGHT}%;             opacity: 0; }
  100%      { top: ${SEL_TOP + SEL_HEIGHT}%;             opacity: 0; }
}
@keyframes aligned-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(200,249,122,0); }
  50%      { box-shadow: 0 0 0 6px rgba(200,249,122,0.15); }
}
`;

export default function WeekDemo() {
  return (
    <>
      <style>{css}</style>
      <div style={{
        backgroundColor: '#f5f5f0',
        border: '1px solid #e0e0d8',
        borderRadius: 16,
        padding: '16px 16px 12px',
        fontFamily: 'system-ui, sans-serif',
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Mini app header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 300, letterSpacing: '-0.06em', color: '#1a1a18' }}>aligned</span>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0d8', borderRadius: 7, padding: '3px 10px', fontSize: 12, color: '#888' }}>
            Room <span style={{ fontWeight: 700, letterSpacing: '0.1em', color: '#1a2e0a' }}>WTXPPS</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {['#4a8000', '#1c3461'].map((c, i) => (
              <div key={i} style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: c, border: '2px solid #f5f5f0', marginLeft: i ? -6 : 0, fontSize: 10, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{i + 1}</div>
            ))}
            <span style={{ fontSize: 12, color: '#888', marginLeft: 6, lineHeight: '18px' }}>2 people</span>
          </div>
        </div>

        {/* Week view grid */}
        <div style={{ display: 'flex', gap: 2 }}>
          {/* Time labels */}
          <div style={{ width: 28, flexShrink: 0, position: 'relative', height: 240 }}>
            {HOUR_LABELS.map(({ label, pct }) => (
              <div key={label} style={{ position: 'absolute', top: `calc(${pct}% - 7px)`, right: 4, fontSize: 10, color: '#bbb', lineHeight: 1 }}>
                {label}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map((day, dayIdx) => {
            const isSel = dayIdx === SEL_DAY;
            const busyForDay = BUSY.filter(b => b.d === dayIdx);

            return (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Day label */}
                <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: dayIdx === 4 ? '#4a8000' : '#999', letterSpacing: '0.05em', paddingBottom: 3 }}>
                  {day}
                  {dayIdx === 4 && <div style={{ fontSize: 13, fontWeight: 700, color: '#4a8000' }}>18</div>}
                  {dayIdx !== 4 && <div style={{ fontSize: 13, fontWeight: 700, color: '#555' }}>{11 + dayIdx + (dayIdx >= 4 ? 1 : 0)}</div>}
                </div>

                {/* Column */}
                <div style={{
                  flex: 1,
                  height: 210,
                  backgroundColor: '#daf5b0',
                  borderRadius: 4,
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'crosshair',
                  animation: isSel ? 'aligned-pulse 2.5s 1.2s ease-in-out infinite' : undefined,
                }}>
                  {/* SVG grid lines */}
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(i => {
                      const y = `${(i / 16) * 100}%`;
                      return (
                        <g key={i}>
                          <line x1={0} y1={y} x2="100%" y2={y} stroke="#bbb" strokeWidth={0.8} />
                          {i < 16 && (
                            <>
                              <line x1={0} y1={`${((i + 0.5) / 16) * 100}%`} x2="100%" y2={`${((i + 0.5) / 16) * 100}%`} stroke="#d4d4d4" strokeWidth={0.6} strokeDasharray="3 3" />
                              <line x1={0} y1={`${((i + 0.25) / 16) * 100}%`} x2="100%" y2={`${((i + 0.25) / 16) * 100}%`} stroke="#e4e4e4" strokeWidth={0.4} strokeDasharray="2 5" />
                              <line x1={0} y1={`${((i + 0.75) / 16) * 100}%`} x2="100%" y2={`${((i + 0.75) / 16) * 100}%`} stroke="#e4e4e4" strokeWidth={0.4} strokeDasharray="2 5" />
                            </>
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {/* Busy blocks */}
                  {busyForDay.map((b, j) => (
                    <div key={j} style={{
                      position: 'absolute',
                      top: `${b.top}%`,
                      height: `${b.h}%`,
                      left: 0, right: 0,
                      backgroundColor: b.c,
                      pointerEvents: 'none',
                    }} />
                  ))}

                  {/* Animated selection overlay */}
                  {isSel && (
                    <>
                      <div style={{
                        position: 'absolute',
                        left: 0, right: 0,
                        backgroundColor: 'rgba(74,128,0,0.22)',
                        border: '2px solid #4a8000',
                        borderRadius: 3,
                        pointerEvents: 'none',
                        animation: 'aligned-sel-grow 4.8s ease-in-out infinite',
                      }} />
                      {/* Cursor dot */}
                      <div style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 8, height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#4a8000',
                        pointerEvents: 'none',
                        animation: 'aligned-cursor 4.8s ease-in-out infinite',
                      }} />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom label */}
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#aaa' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: 'rgba(74,128,0,0.6)', display: 'inline-block' }} />Person 1 busy</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: 'rgba(28,52,97,0.7)', display: 'inline-block' }} />Person 2 busy</span>
          </div>
          <span style={{ fontSize: 11, color: '#4a8000', fontWeight: 500 }}>drag to select →</span>
        </div>
      </div>
    </>
  );
}
