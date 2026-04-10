import { addDays, parseISO } from 'date-fns';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export interface BusyBlock {
  start: string;
  end: string;
}

export async function fetchBusyBlocks(
  accessToken: string,
  daysAhead: number = 14
): Promise<BusyBlock[]> {
  const timeMin = new Date().toISOString();
  const timeMax = addDays(new Date(), daysAhead).toISOString();

  const res = await fetch(
    `${CALENDAR_API}/calendars/primary/events?` +
      new URLSearchParams({
        timeMin,
        timeMax,
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      }),
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) throw new Error(`Calendar API error: ${res.status}`);

  const data = await res.json();
  const events = data.items || [];

  return events
    .filter((e: any) => e.start?.dateTime && e.end?.dateTime)
    .map((e: any) => ({ start: e.start.dateTime, end: e.end.dateTime }));
}

export function isHourBusy(hour: Date, blocks: BusyBlock[]): boolean {
  const hourEnd = new Date(hour.getTime() + 60 * 60 * 1000);
  return blocks.some((b) => {
    const start = parseISO(b.start);
    const end = parseISO(b.end);
    return start < hourEnd && end > hour;
  });
}

export function findMutualFreeSlots(
  myBlocks: BusyBlock[],
  theirBlocks: BusyBlock[],
  daysAhead: number = 14
): { start: Date; end: Date }[] {
  const freeSlots: { start: Date; end: Date }[] = [];
  const now = new Date();

  for (let d = 0; d < daysAhead; d++) {
    const day = addDays(now, d);
    for (let h = 6; h < 22; h++) {
      const slotStart = new Date(day);
      slotStart.setHours(h, 0, 0, 0);
      if (slotStart < now) continue;
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
      if (!isHourBusy(slotStart, myBlocks) && !isHourBusy(slotStart, theirBlocks)) {
        freeSlots.push({ start: slotStart, end: slotEnd });
      }
    }
  }

  return freeSlots;
}

export async function createCalendarEvent(
  accessToken: string,
  title: string,
  start: Date,
  end: Date
): Promise<string> {
  const res = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: title,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    }),
  });

  if (!res.ok) throw new Error(`Failed to create event: ${res.status}`);
  const event = await res.json();
  return event.id;
}
