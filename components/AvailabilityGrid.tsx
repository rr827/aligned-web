'use client';

import { format, parseISO, isSameDay } from 'date-fns';
import { BusyBlock } from '@/lib/calendar';

const HOUR_HEIGHT = 56;
const HOURS_START = 6;
const HOURS_END = 23;
const TOTAL_HOURS = HOURS_END - HOURS_START;
const TIMELINE_HEIGHT = HOUR_HEIGHT * TOTAL_HOURS;

interface Props {
  dates: Date[];
  myBlocks: BusyBlock[];
  theirBlocks?: BusyBlock[];
}

function getBlockPosition(block: BusyBlock) {
  const start = parseISO(block.start);
  const end = parseISO(block.end);
  const startMin = start.getHours() * 60 + start.getMinutes();
  const endMin = end.getHours() * 60 + end.getMinutes();
  const top = ((startMin - HOURS_START * 60) / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 4);
  return { top, height };
}

export default function AvailabilityGrid({ dates, myBlocks, theirBlocks }: Props) {
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => HOURS_START + i);
  const hasThem = !!theirBlocks;

  return (
    <div style={{ display: 'flex', height: TIMELINE_HEIGHT, userSelect: 'none' }}>
      {/* Time labels */}
      <div style={{ width: 44, flexShrink: 0 }}>
        {hours.map(h => (
          <div key={h} style={{ height: HOUR_HEIGHT, paddingTop: 4 }}>
            <span style={{ fontSize: 11, color: '#555' }}>
              {format(new Date().setHours(h, 0, 0, 0), 'h a')}
            </span>
          </div>
        ))}
      </div>

      {/* Day columns */}
      {dates.map((date, di) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayMyBlocks = myBlocks.filter(
          b => format(parseISO(b.start), 'yyyy-MM-dd') === dateStr
        );
        const dayTheirBlocks = theirBlocks?.filter(
          b => format(parseISO(b.start), 'yyyy-MM-dd') === dateStr
        );
        const isToday = isSameDay(date, new Date());

        return (
          <div key={dateStr} style={{ flex: 1, position: 'relative', height: TIMELINE_HEIGHT, borderLeft: di > 0 ? '1px solid #e2e2dc' : 'none' }}>
            {/* Hour grid lines */}
            {hours.map(h => (
              <div key={h} style={{
                position: 'absolute', left: 0, right: 0,
                top: (h - HOURS_START) * HOUR_HEIGHT,
                height: 1, backgroundColor: '#e8e8e2', pointerEvents: 'none',
              }} />
            ))}

            {/* Today tint */}
            {isToday && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(74,128,0,0.05)', pointerEvents: 'none' }} />
            )}

            {/* My blocks — left half when split, full when solo */}
            {dayMyBlocks.map((block, i) => {
              const { top, height } = getBlockPosition(block);
              return (
                <div key={i} style={{
                  position: 'absolute',
                  left: 3,
                  right: hasThem ? '50%' : 3,
                  top, height,
                  backgroundColor: '#e05a8a',
                  border: '1px solid rgba(200,53,120,0.35)',
                  borderRadius: 4,
                }} />
              );
            })}

            {/* Their blocks — right half */}
            {hasThem && (dayTheirBlocks ?? []).map((block, i) => {
              const { top, height } = getBlockPosition(block);
              return (
                <div key={i} style={{
                  position: 'absolute',
                  left: '50%',
                  right: 3,
                  top, height,
                  backgroundColor: '#3a8bc8',
                  border: '1px solid rgba(52,152,219,0.3)',
                  borderRadius: 4,
                }} />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
