'use client';

import { format, parseISO } from 'date-fns';
import { BusyBlock } from '@/lib/calendar';

const HOUR_HEIGHT = 60;
const HOURS_START = 6;
const HOURS_END = 23;
const TOTAL_HOURS = HOURS_END - HOURS_START;
const TIMELINE_HEIGHT = HOUR_HEIGHT * TOTAL_HOURS;

interface Props {
  date: Date;
  blocks: BusyBlock[];
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

export default function AvailabilityGrid({ blocks, theirBlocks }: Props) {
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => HOURS_START + i);

  return (
    <div style={{ display: 'flex', height: TIMELINE_HEIGHT, userSelect: 'none' }}>
      {/* Time labels */}
      <div style={{ width: 44, flexShrink: 0 }}>
        {hours.map((h) => (
          <div key={h} style={{ height: HOUR_HEIGHT, paddingTop: 4 }}>
            <span style={{ fontSize: 11, color: '#555' }}>
              {format(new Date().setHours(h, 0, 0, 0), 'h a')}
            </span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', gap: 4 }}>
        {/* Grid lines */}
        {hours.map((h) => (
          <div
            key={h}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: (h - HOURS_START) * HOUR_HEIGHT,
              height: 1,
              backgroundColor: '#1a1a1a',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* My blocks */}
        <div style={{ flex: 1, position: 'relative', height: TIMELINE_HEIGHT }}>
          {blocks.map((block, i) => {
            const { top, height } = getBlockPosition(block);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 3,
                  right: 3,
                  top,
                  height,
                  backgroundColor: '#c8266a',
                  border: '1px solid #e0357a',
                  borderRadius: 6,
                }}
              />
            );
          })}
        </div>

        {/* Their blocks */}
        {theirBlocks && (
          <div style={{ flex: 1, position: 'relative', height: TIMELINE_HEIGHT }}>
            {theirBlocks.map((block, i) => {
              const { top, height } = getBlockPosition(block);
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: 3,
                    right: 3,
                    top,
                    height,
                    backgroundColor: '#3498db',
                    opacity: 0.85,
                    borderRadius: 6,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
