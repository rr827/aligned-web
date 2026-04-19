'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  format, addDays, startOfWeek, isSameDay, differenceInMinutes, parseISO, addMinutes,
} from 'date-fns';
import { loadToken } from '@/lib/auth';
import { BusyBlock } from '@/lib/calendar';
import { decodePayload, AlignedPayload, buildRoomLink } from '@/lib/payload';
import { getRoom, proposeTime, RoomRow } from '@/lib/room';

// ── Types ──────────────────────────────────────────────────────────────────

type DailyView = 'swimlane' | 'grid' | 'arc';

// ── Helpers ────────────────────────────────────────────────────────────────

function getWeekDates(base: Date): Date[] {
  const monday = startOfWeek(base, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** How many of the participants are free during [slotStart, slotEnd] */
function overlapCount(
  slotStart: Date,
  slotEnd: Date,
  allBlocks: BusyBlock[][]
): number {
  return allBlocks.filter(blocks =>
    !blocks.some(b => {
      const bs = parseISO(b.start), be = parseISO(b.end);
      return bs < slotEnd && be > slotStart;
    })
  ).length;
}

/** Merge busy blocks for a participant for a given date (6am–10pm) */
function getDayBusy(date: Date, blocks: BusyBlock[]): { startMin: number; endMin: number }[] {
  const dateStr = format(date, 'yyyy-MM-dd');
  return blocks
    .filter(b => format(parseISO(b.start), 'yyyy-MM-dd') === dateStr)
    .map(b => ({
      startMin: parseISO(b.start).getHours() * 60 + parseISO(b.start).getMinutes(),
      endMin: parseISO(b.end).getHours() * 60 + parseISO(b.end).getMinutes(),
    }));
}

function rankSlots(
  allBlocks: BusyBlock[][],
  preferences: (string | null)[],
  weekDates: Date[]
): { start: Date; end: Date; count: number; score: number }[] {
  const slots: { start: Date; end: Date; count: number; score: number }[] = [];
  const now = new Date();

  for (const date of weekDates) {
    for (let h = 6; h < 22; h++) {
      const slotStart = new Date(date);
      slotStart.setHours(h, 0, 0, 0);
      if (slotStart <= now) continue;
      const slotEnd = addMinutes(slotStart, 60);
      const count = overlapCount(slotStart, slotEnd, allBlocks);
      if (count === 0 || count < allBlocks.length) continue;
      let score = count * 10;
      // Preference bonus
      preferences.forEach(p => {
        if (p === 'morning' && h >= 6 && h < 12) score += 3;
        if (p === 'afternoon' && h >= 12 && h < 18) score += 3;
        if (p === 'evening' && h >= 18) score += 3;
      });
      slots.push({ start: slotStart, end: slotEnd, count, score });
    }
  }

  return slots.sort((a, b) => b.score - a.score).slice(0, 12);
}

// Teal opacity by overlap fraction
function weekCellTeal(count: number, total: number): string {
  if (count === 0 || total === 0) return 'transparent';
  const frac = count / total;
  // 1 person free = faint teal, all free = deep teal
  const alpha = 0.15 + frac * 0.75;
  return `rgba(0, 160, 140, ${alpha.toFixed(2)})`;
}

// 30-min slots, 6am–10pm = 32 slots
const HALF_HOURS = Array.from({ length: 32 }, (_, i) => ({
  h: Math.floor(i / 2) + 6,
  m: (i % 2) * 30,
  label: i % 2 === 0 ? (Math.floor(i / 2) + 6 === 12 ? '12p' : Math.floor(i / 2) + 6 > 12 ? `${Math.floor(i / 2) + 6 - 12}p` : `${Math.floor(i / 2) + 6}a`) : '',
}));
// Keep HOURS for GridDayView (1hr rows)
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);
const PARTICIPANT_COLORS = ['#4a8000', '#1c3461', '#7a3800', '#5a0a5a', '#0a4a5a'];

// ── Sub-components ─────────────────────────────────────────────────────────

function WeekView({
  weekDates, allBlocks, onSlotClick, selectedSlot,
}: {
  weekDates: Date[];
  allBlocks: BusyBlock[][];
  onSlotClick: (slot: { start: Date; end: Date }) => void;
  selectedSlot: { start: Date; end: Date } | null;
}) {
  const total = allBlocks.length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(7, 1fr)', gap: 2, minWidth: 560 }}>
      {/* Header row */}
      <div />
      {weekDates.map(date => (
        <div key={date.toISOString()} style={{ textAlign: 'center', padding: '6px 0', fontSize: 11, fontWeight: 600, color: isSameDay(date, new Date()) ? '#4a8000' : '#888', letterSpacing: '0.05em' }}>
          <div>{format(date, 'EEE').toUpperCase()}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: isSameDay(date, new Date()) ? '#4a8000' : '#1a2e0a' }}>{format(date, 'd')}</div>
        </div>
      ))}

      {/* 30-min slot rows */}
      {HALF_HOURS.map(({ h, m, label }) => (
        <>
          <div key={`lbl-${h}-${m}`} style={{ fontSize: 10, color: '#aaa', textAlign: 'right', paddingRight: 6, paddingTop: 4, height: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
            {label}
          </div>
          {weekDates.map(date => {
            const slotStart = new Date(date);
            slotStart.setHours(h, m, 0, 0);
            const slotEnd = addMinutes(slotStart, 30);
            const count = overlapCount(slotStart, slotEnd, allBlocks);
            const isPast = slotStart < new Date();
            const isSelected = selectedSlot?.start.getTime() === slotStart.getTime();
            const isFullOverlap = count === total && total > 0;
            const bg = isSelected ? '#4a8000' : isPast ? '#f0f0ea' : weekCellTeal(count, total);
            return (
              <button key={date.toISOString() + h + m}
                onClick={() => !isPast && onSlotClick({ start: slotStart, end: slotEnd })}
                title={count > 0 ? `${count}/${total} free` : 'Busy'}
                style={{ height: 22, borderRadius: 4, border: isSelected ? '1.5px solid #4a8000' : isFullOverlap ? '1.5px solid rgba(0,160,140,0.4)' : '1px solid rgba(0,0,0,0.04)', backgroundColor: bg, cursor: isPast ? 'default' : 'pointer', opacity: isPast ? 0.35 : 1, transition: 'background 0.1s' }} />
            );
          })}
        </>
      ))}
    </div>
  );
}

function SwimLaneView({
  date, participants, allBlocks, onSlotClick,
}: {
  date: Date;
  participants: AlignedPayload[];
  allBlocks: BusyBlock[][];
  onSlotClick: (slot: { start: Date; end: Date }) => void;
}) {
  const [hoverMin, setHoverMin] = useState<number | null>(null);
  const DAY_START = 6 * 60, DAY_END = 22 * 60, DURATION = DAY_END - DAY_START;

  const toPercent = (min: number) => ((min - DAY_START) / DURATION) * 100;

  // Compute overlap bands (all participants free)
  const overlapBands: { startMin: number; endMin: number }[] = [];
  if (participants.length > 0) {
    for (let m = DAY_START; m < DAY_END; m += 15) {
      const slotStart = new Date(date); slotStart.setHours(Math.floor(m / 60), m % 60, 0, 0);
      const slotEnd = addMinutes(slotStart, 15);
      if (overlapCount(slotStart, slotEnd, allBlocks) === participants.length) {
        if (overlapBands.length && overlapBands[overlapBands.length - 1].endMin === m) {
          overlapBands[overlapBands.length - 1].endMin = m + 15;
        } else {
          overlapBands.push({ startMin: m, endMin: m + 15 });
        }
      }
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const clickMin = DAY_START + pct * DURATION;
    const roundedMin = Math.round(clickMin / 30) * 30;
    const slotStart = new Date(date); slotStart.setHours(Math.floor(roundedMin / 60), roundedMin % 60, 0, 0);
    onSlotClick({ start: slotStart, end: addMinutes(slotStart, 60) });
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Time axis */}
      <div style={{ position: 'relative', height: 20, marginLeft: 100, minWidth: 600, marginBottom: 8 }}>
        {[6, 9, 12, 15, 18, 21].map(h => (
          <span key={h} style={{ position: 'absolute', left: `${toPercent(h * 60)}%`, fontSize: 10, color: '#aaa', transform: 'translateX(-50%)' }}>
            {h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`}
          </span>
        ))}
      </div>

      {/* Person rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 600 }}>
        {participants.map((p, i) => {
          const busySegments = getDayBusy(date, p.blocks);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 92, fontSize: 12, color: '#555', textAlign: 'right', flexShrink: 0 }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length], marginRight: 5 }} />
                Person {i + 1}
              </div>
              <div
                onClick={handleClick}
                onMouseMove={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  setHoverMin(Math.round((DAY_START + pct * DURATION) / 30) * 30);
                }}
                onMouseLeave={() => setHoverMin(null)}
                style={{ flex: 1, height: 36, borderRadius: 8, backgroundColor: '#e8f5e0', position: 'relative', cursor: 'pointer', overflow: 'hidden' }}>
                {/* Busy blocks */}
                {busySegments.map((seg, j) => (
                  <div key={j} style={{
                    position: 'absolute',
                    left: `${toPercent(seg.startMin)}%`,
                    width: `${toPercent(seg.endMin) - toPercent(seg.startMin)}%`,
                    top: 0, bottom: 0,
                    backgroundColor: PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length],
                    opacity: 0.7,
                    borderRadius: 4,
                  }} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Overlap band */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 92, fontSize: 11, color: '#4a8000', textAlign: 'right', fontWeight: 600, flexShrink: 0 }}>Overlap</div>
          <div style={{ flex: 1, height: 20, borderRadius: 8, backgroundColor: '#f0f0ea', position: 'relative', overflow: 'hidden' }}>
            {overlapBands.map((band, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${toPercent(band.startMin)}%`,
                width: `${toPercent(band.endMin) - toPercent(band.startMin)}%`,
                top: 0, bottom: 0,
                backgroundColor: '#4a8000',
                borderRadius: 3,
              }} />
            ))}
            {/* Hover cursor */}
            {hoverMin !== null && hoverMin >= DAY_START && hoverMin <= DAY_END && (
              <div style={{ position: 'absolute', left: `${toPercent(hoverMin)}%`, top: 0, bottom: 0, width: 1, backgroundColor: '#4a8000', opacity: 0.5 }} />
            )}
          </div>
        </div>

        {/* Hover time label */}
        {hoverMin !== null && (
          <div style={{ marginLeft: 100, fontSize: 11, color: '#4a8000' }}>
            {format(new Date(date).setHours(Math.floor(hoverMin / 60), hoverMin % 60), 'h:mm a')}
          </div>
        )}
      </div>
    </div>
  );
}

function GridDayView({
  date, participants, allBlocks, onSlotClick,
}: {
  date: Date;
  participants: AlignedPayload[];
  allBlocks: BusyBlock[][];
  onSlotClick: (slot: { start: Date; end: Date }) => void;
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${participants.length}, 1fr)`, gap: 3, minWidth: Math.max(300, participants.length * 80 + 50) }}>
        {/* Headers */}
        <div />
        {participants.map((_, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length], padding: '6px 0' }}>
            P{i + 1}
          </div>
        ))}

        {/* Hour rows */}
        {HOURS.map(hour => {
          const slotStart = new Date(date); slotStart.setHours(hour, 0, 0, 0);
          const slotEnd = addMinutes(slotStart, 60);
          const isPast = slotStart < new Date();
          const allFree = overlapCount(slotStart, slotEnd, allBlocks) === participants.length && participants.length > 0;
          return (
            <>
              <div key={`lbl-${hour}`} style={{ fontSize: 10, color: '#aaa', textAlign: 'right', paddingRight: 6, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                {hour === 12 ? '12p' : hour > 12 ? `${hour - 12}p` : `${hour}a`}
              </div>
              {allBlocks.map((blocks, i) => {
                const busy = blocks.some(b => {
                  const bs = parseISO(b.start), be = parseISO(b.end);
                  return bs < slotEnd && be > slotStart;
                });
                return (
                  <button key={i}
                    onClick={() => !isPast && allFree && onSlotClick({ start: slotStart, end: slotEnd })}
                    style={{ height: 32, borderRadius: 6, border: allFree ? '1.5px solid rgba(0,160,140,0.4)' : '1px solid rgba(0,0,0,0.05)', backgroundColor: isPast ? '#f5f5f0' : busy ? `${PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length]}30` : '#e8f5e0', cursor: allFree && !isPast ? 'pointer' : 'default', opacity: isPast ? 0.5 : 1 }} />
                );
              })}
            </>
          );
        })}
      </div>
    </div>
  );
}

function ArcClockView({
  date, participants, allBlocks, onSlotClick,
}: {
  date: Date;
  participants: AlignedPayload[];
  allBlocks: BusyBlock[][];
  onSlotClick: (slot: { start: Date; end: Date }) => void;
}) {
  const svgSize = 300;
  const cx = svgSize / 2, cy = svgSize / 2;
  const ringGap = 10;
  const outerR = 130;
  const innerR = outerR - participants.length * ringGap - ringGap;
  const overlapR = innerR - 4;

  const hourToAngle = (hour: number) => ((hour - 6) / 24) * 360 - 90; // 6am at top

  function arcPath(r: number, startAngle: number, endAngle: number): string {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left - cx;
    const my = e.clientY - rect.top - cy;
    let angle = (Math.atan2(my, mx) * 180) / Math.PI + 90; // 0 = top
    if (angle < 0) angle += 360;
    const hour = 6 + (angle / 360) * 24;
    const h = Math.floor(hour), m = Math.round((hour - h) * 60 / 30) * 30;
    const slotStart = new Date(date); slotStart.setHours(h, m, 0, 0);
    onSlotClick({ start: slotStart, end: addMinutes(slotStart, 60) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <svg width={svgSize} height={svgSize} onClick={handleSvgClick} style={{ cursor: 'pointer' }}>
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={outerR + 6} fill="#f0f0ea" />

        {/* Hour ticks */}
        {[6, 9, 12, 15, 18, 21].map(h => {
          const ang = (hourToAngle(h) * Math.PI) / 180;
          const tx = cx + (outerR + 16) * Math.cos(ang);
          const ty = cy + (outerR + 16) * Math.sin(ang);
          return (
            <text key={h} x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="#aaa">
              {h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`}
            </text>
          );
        })}

        {/* Participant rings (outermost = participant 0) */}
        {participants.map((p, i) => {
          const r = outerR - i * ringGap;
          const busySegs = getDayBusy(date, p.blocks);
          const sleepFrom = p.sleep ? parseInt(p.sleep.from) : null;
          const sleepTo = p.sleep ? parseInt(p.sleep.to) : null;

          return (
            <g key={i}>
              {/* Base arc (free) */}
              <path d={arcPath(r, hourToAngle(6), hourToAngle(22))} fill="none"
                stroke="#d4edbb" strokeWidth={ringGap - 2} strokeLinecap="butt" />
              {/* Busy segments */}
              {busySegs.map((seg, j) => {
                const startH = seg.startMin / 60;
                const endH = seg.endMin / 60;
                if (endH < 6 || startH > 22) return null;
                return (
                  <path key={j}
                    d={arcPath(r, hourToAngle(Math.max(startH, 6)), hourToAngle(Math.min(endH, 22)))}
                    fill="none"
                    stroke={PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length]}
                    strokeWidth={ringGap - 2}
                    strokeLinecap="butt"
                    opacity={0.6}
                  />
                );
              })}
              {/* Sleep dim overlay */}
              {sleepFrom !== null && sleepTo !== null && (
                <path
                  d={arcPath(r, hourToAngle(Math.max(sleepFrom - 24 < 6 ? sleepFrom : sleepFrom, 6)), hourToAngle(Math.min(sleepTo, 22)))}
                  fill="none" stroke="#aaa" strokeWidth={ringGap - 2} strokeLinecap="butt" opacity={0.4}
                />
              )}
            </g>
          );
        })}

        {/* Overlap wedges from center */}
        {Array.from({ length: 16 * 4 }).map((_, qi) => {
          const startH = 6 + qi * 0.25;
          const endH = startH + 0.25;
          const slotStart = new Date(date); slotStart.setHours(Math.floor(startH), (startH % 1) * 60, 0, 0);
          const slotEnd = addMinutes(slotStart, 15);
          const count = overlapCount(slotStart, slotEnd, allBlocks);
          if (count === 0) return null;
          const frac = count / Math.max(participants.length, 1);
          const r = overlapR * frac * 0.7 + 10;
          const alpha = 0.2 + frac * 0.6;
          return (
            <path key={qi}
              d={arcPath(r / 2, hourToAngle(startH), hourToAngle(endH))}
              fill="none"
              stroke={`rgba(0,160,140,${alpha.toFixed(2)})`}
              strokeWidth={r}
              strokeLinecap="butt"
            />
          );
        })}

        {/* Center label */}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={12} fill="#4a8000" fontWeight={600}>
          {participants.length > 0 ? 'Tap to propose' : ''}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="#888">
          {format(date, 'EEE, MMM d')}
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#888', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, backgroundColor: '#d4edbb', marginRight: 4 }} />Free</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, backgroundColor: 'rgba(0,160,140,0.6)', marginRight: 4 }} />Overlap</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, backgroundColor: '#aaa', marginRight: 4 }} />Busy/Sleep</span>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

function RoomContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [room, setRoom] = useState<RoomRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [participants, setParticipants] = useState<AlignedPayload[]>([]);
  const [allBlocks, setAllBlocks] = useState<BusyBlock[][]>([]);
  const [myIndex, setMyIndex] = useState<number | null>(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekBase, setWeekBase] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [dailyView, setDailyView] = useState<DailyView>('swimlane');

  const [rankedSlots, setRankedSlots] = useState<{ start: Date; end: Date; count: number; score: number }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [proposing, setProposing] = useState(false);
  const [proposed, setProposed] = useState(false);
  const [copied, setCopied] = useState(false);

  const weekDates = getWeekDates(weekBase);

  useEffect(() => {
    (async () => {
      try {
        const data = await getRoom(code);
        if (!data) { setError('Room not found or expired.'); setLoading(false); return; }
        setRoom(data);

        const decoded = data.participants.map(p => decodePayload(p));
        setParticipants(decoded);
        setAllBlocks(decoded.map(p => p.blocks));

        const idx = localStorage.getItem(`room_${code}`);
        setMyIndex(idx !== null ? parseInt(idx) : null);

        const slots = rankSlots(decoded.map(p => p.blocks), decoded.map(p => p.preference), weekDates);
        setRankedSlots(slots);
      } catch {
        setError('Failed to load room.');
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Re-rank when week changes
  useEffect(() => {
    if (participants.length === 0) return;
    setRankedSlots(rankSlots(allBlocks, participants.map(p => p.preference), weekDates));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekBase]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(buildRoomLink(code));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePropose = async () => {
    if (!selectedSlot || myIndex === null) return;
    setProposing(true);
    try {
      await proposeTime(code, myIndex, selectedSlot.start.toISOString(), selectedSlot.end.toISOString());
      setProposed(true);
    } catch {
      alert('Could not save proposal. Try again.');
    } finally {
      setProposing(false);
    }
  };

  const handleSlotClick = (slot: { start: Date; end: Date }) => {
    setSelectedSlot(prev => prev?.start.getTime() === slot.start.getTime() ? null : slot);
    setProposed(false);
    setSelectedDate(slot.start);
  };

  const handleJoin = () => router.push(`/connect?room=${code}`);

  const isConnected = !!loadToken();

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(74,128,0,0.3)', borderTopColor: '#4a8000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'system-ui, sans-serif' }}>
      <p style={{ fontSize: 16, color: '#555' }}>{error}</p>
      <button onClick={() => router.replace('/connect')} style={{ fontSize: 14, color: '#4a8000', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Start a new room</button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f0', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', color: '#111' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #e2e2dc', padding: '0 28px', height: 54, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <span style={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.06em', color: '#1a1a18' }}>aligned</span>

        {/* Room code badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#fff', border: '1px solid #e0e0d8', borderRadius: 10, padding: '5px 12px' }}>
          <span style={{ fontSize: 11, color: '#888' }}>Room</span>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: '#1a2e0a' }}>{code}</span>
        </div>

        {/* Participant count */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {participants.map((_, i) => (
            <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700, border: '2px solid #f5f5f0', marginLeft: i > 0 ? -8 : 0 }}>
              {i + 1}
            </div>
          ))}
          <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>{participants.length} {participants.length === 1 ? 'person' : 'people'}</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 2, backgroundColor: '#fff', border: '1px solid #1a1a1a', borderRadius: 9, padding: 3 }}>
          {(['week', 'day'] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              style={{ padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', backgroundColor: viewMode === m ? '#d8d8d2' : 'transparent', color: viewMode === m ? '#0a0a0a' : '#555' }}>
              {m === 'week' ? 'Week' : 'Day'}
            </button>
          ))}
        </div>

        {viewMode === 'day' && (
          <div style={{ display: 'flex', gap: 2, backgroundColor: '#fff', border: '1px solid #e0e0d8', borderRadius: 9, padding: 3 }}>
            {(['swimlane', 'grid', 'arc'] as DailyView[]).map(v => (
              <button key={v} onClick={() => setDailyView(v)}
                style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, border: 'none', cursor: 'pointer', backgroundColor: dailyView === v ? '#d8d8d2' : 'transparent', color: dailyView === v ? '#0a0a0a' : '#555', textTransform: 'capitalize' }}>
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date nav */}
      <div style={{ borderBottom: '1px solid #e2e2dc', padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {viewMode === 'week' ? (
          <>
            <button onClick={() => setWeekBase(d => addDays(d, -7))} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #1a1a1a', background: '#fff', cursor: 'pointer', fontSize: 13 }}>←</button>
            <span style={{ fontSize: 13, color: '#555', minWidth: 180 }}>{format(weekDates[0], 'MMM d')} – {format(weekDates[6], 'MMM d, yyyy')}</span>
            <button onClick={() => setWeekBase(d => addDays(d, 7))} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #1a1a1a', background: '#fff', cursor: 'pointer', fontSize: 13 }}>→</button>
            <button onClick={() => setWeekBase(new Date())} style={{ fontSize: 12, color: '#555', background: 'none', border: '1px solid #1a1a1a', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>Today</button>
          </>
        ) : (
          <>
            <button onClick={() => setSelectedDate(d => addDays(d, -1))} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #1a1a1a', background: '#fff', cursor: 'pointer', fontSize: 13 }}>←</button>
            <span style={{ fontSize: 13, color: '#555', minWidth: 160 }}>{format(selectedDate, 'EEEE, MMMM d')}</span>
            <button onClick={() => setSelectedDate(d => addDays(d, 1))} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #1a1a1a', background: '#fff', cursor: 'pointer', fontSize: 13 }}>→</button>
            <button onClick={() => setSelectedDate(new Date())} style={{ fontSize: 12, color: '#555', background: 'none', border: '1px solid #1a1a1a', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>Today</button>
          </>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Main view area */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: '28px 32px 48px' }}>
          {participants.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 80, color: '#888', fontSize: 14 }}>
              <p style={{ marginBottom: 8 }}>No one has connected yet.</p>
              {!isConnected && <button onClick={handleJoin} style={{ fontSize: 14, color: '#4a8000', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Be the first to join →</button>}
            </div>
          ) : viewMode === 'week' ? (
            <WeekView weekDates={weekDates} allBlocks={allBlocks} onSlotClick={handleSlotClick} selectedSlot={selectedSlot} />
          ) : dailyView === 'swimlane' ? (
            <SwimLaneView date={selectedDate} participants={participants} allBlocks={allBlocks} onSlotClick={handleSlotClick} />
          ) : dailyView === 'grid' ? (
            <GridDayView date={selectedDate} participants={participants} allBlocks={allBlocks} onSlotClick={handleSlotClick} />
          ) : (
            <ArcClockView date={selectedDate} participants={participants} allBlocks={allBlocks} onSlotClick={handleSlotClick} />
          )}
        </div>

        {/* Side panel */}
        <div style={{ width: 288, borderLeft: '1px solid #e2e2dc', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>

          {/* Share / Join */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e2dc', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={handleCopyLink}
              style={{ width: '100%', backgroundColor: '#4a8000', color: '#fff', borderRadius: 11, padding: '12px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              {copied ? '✓ Link copied!' : 'Copy invite link'}
            </button>
            {!isConnected && (
              <button onClick={handleJoin}
                style={{ width: '100%', backgroundColor: '#fff', color: '#4a8000', borderRadius: 11, padding: '12px', fontSize: 13, fontWeight: 600, border: '1.5px solid #4a8000', cursor: 'pointer' }}>
                Join this room
              </button>
            )}
          </div>

          {/* Proposals list */}
          {room?.proposals && room.proposals.length > 0 && (
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e2dc' }}>
              <p style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>Proposals</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {room.proposals.map((prop, i) => (
                  <div key={i} style={{ padding: '8px 12px', borderRadius: 9, backgroundColor: '#fff', border: '1px solid #e0e0d8', fontSize: 12 }}>
                    <p style={{ color: '#888', marginBottom: 2 }}>Person {prop.proposer_index + 1} suggests</p>
                    <p style={{ fontWeight: 600, color: '#1a2e0a' }}>
                      {format(parseISO(prop.start_time), 'EEE MMM d, h:mm a')} – {format(parseISO(prop.end_time), 'h:mm a')}
                    </p>
                    <span style={{ fontSize: 10, color: prop.status === 'pending' ? '#888' : '#4a8000', textTransform: 'capitalize' }}>{prop.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best slots */}
          <div style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>
              Best times · {rankedSlots.length} found
            </p>
            {participants.length < 2 ? (
              <p style={{ fontSize: 12, color: '#aaa' }}>Waiting for more people to join…</p>
            ) : rankedSlots.length === 0 ? (
              <p style={{ fontSize: 12, color: '#aaa' }}>No mutual free slots this week.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rankedSlots.map((slot, i) => {
                  const isSelected = selectedSlot?.start.getTime() === slot.start.getTime();
                  return (
                    <button key={i} onClick={() => handleSlotClick(slot)}
                      style={{ padding: '9px 12px', backgroundColor: isSelected ? 'rgba(74,128,0,0.08)' : '#fff', border: `1px solid ${isSelected ? '#4a8000' : '#e2e2dc'}`, borderRadius: 9, display: 'flex', flexDirection: 'column', gap: 2, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                      <span style={{ fontSize: 11, color: '#888' }}>{format(slot.start, 'EEE, MMM d')}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1a2e0a' }}>{format(slot.start, 'h:mm a')} – {format(slot.end, 'h:mm a')}</span>
                      <span style={{ fontSize: 10, color: '#4a8000' }}>{slot.count}/{participants.length} free</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Propose selected slot */}
          {selectedSlot && myIndex !== null && (
            <div style={{ margin: '0 20px 20px', padding: '12px', backgroundColor: 'rgba(74,128,0,0.06)', border: '1px solid rgba(74,128,0,0.2)', borderRadius: 11 }}>
              <p style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{format(selectedSlot.start, 'EEE, MMM d')}</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1a2e0a', marginBottom: 10 }}>
                {format(selectedSlot.start, 'h:mm a')} – {format(selectedSlot.end, 'h:mm a')}
              </p>
              {proposed ? (
                <p style={{ fontSize: 13, color: '#4a8000', fontWeight: 600 }}>✓ Proposal shared!</p>
              ) : (
                <button onClick={handlePropose} disabled={proposing}
                  style={{ width: '100%', backgroundColor: '#4a8000', color: '#fff', borderRadius: 9, padding: '10px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: proposing ? 0.6 : 1 }}>
                  {proposing ? 'Proposing...' : 'Suggest this time'}
                </button>
              )}
            </div>
          )}

          <div style={{ flex: 1 }} />
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { scrollbar-width: none; } *::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '2px solid rgba(74,128,0,0.3)', borderTopColor: '#4a8000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <RoomContent />
    </Suspense>
  );
}
