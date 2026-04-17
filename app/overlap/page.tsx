'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format, addDays, isSameDay } from 'date-fns';
import { loadToken, startGoogleAuth } from '@/lib/auth';
import { fetchBusyBlocks, findMutualFreeSlots, createCalendarEvent, BusyBlock } from '@/lib/calendar';
import { decodeAvailability } from '@/lib/payload';

function OverlapContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [theirBlocks, setTheirBlocks] = useState<BusyBlock[]>([]);
  const [freeSlots, setFreeSlots] = useState<{ start: Date; end: Date }[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  useEffect(() => {
    const data = searchParams.get('data');
    if (!data) { router.replace('/'); return; }

    const blocks = decodeAvailability(data);
    setTheirBlocks(blocks);

    const token = loadToken();
    if (!token) {
      setConnected(false);
      setLoading(false);
      return;
    }

    setConnected(true);
    fetchBusyBlocks(token, 14)
      .then((myBlocks) => {
        const slots = findMutualFreeSlots(myBlocks, blocks, 14);
        setFreeSlots(slots);
      })
      .catch(() => setError('Could not load your calendar.'))
      .finally(() => setLoading(false));
  }, [searchParams, router]);

  const handleConnect = async () => {
    await startGoogleAuth(window.location.pathname + window.location.search);
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    const token = loadToken();
    if (!token) { handleConnect(); return; }

    setBooking(true);
    try {
      await createCalendarEvent(token, 'Aligned Session', selectedSlot.start, selectedSlot.end);
      setBooked(true);
    } catch {
      alert('Could not add to calendar. Try again.');
    } finally {
      setBooking(false);
    }
  };

  const slotsForDay = freeSlots.filter((s) => isSameDay(s.start, selectedDay));

  if (!connected && !loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex flex-col">
        {/* Top nav */}
        <div className="flex items-center px-5 pt-10 pb-2">
          <button
            onClick={() => router.replace('/')}
            className="flex items-center gap-1.5 text-[13px] text-[#4a8000] font-medium cursor-pointer"
          >
            <span style={{ fontSize: 16 }}>←</span> Back
          </button>
        </div>

        {/* Hero section */}
        <div className="flex flex-col items-center px-6 pt-10 pb-8 text-center">
          {/* Calendar + overlap illustration */}
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-2xl bg-[#e8f5d0] border-2 border-[#c8e89a] flex items-center justify-center shadow-sm">
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                <rect x="3" y="7" width="32" height="26" rx="4" fill="#d4edbb" stroke="#4a8000" strokeWidth="2"/>
                <rect x="3" y="7" width="32" height="8" rx="4" fill="#8fcc5a"/>
                <rect x="3" y="11" width="32" height="4" fill="#8fcc5a"/>
                <circle cx="12" cy="4" r="2" fill="#4a8000"/>
                <circle cx="26" cy="4" r="2" fill="#4a8000"/>
                <rect x="9" y="19" width="6" height="5" rx="1" fill="#8fcc5a"/>
                <rect x="17" y="19" width="6" height="5" rx="1" fill="#8fcc5a"/>
                <rect x="9" y="26" width="6" height="4" rx="1" fill="#c8e89a"/>
                <rect x="17" y="26" width="6" height="4" rx="1" fill="#c8e89a"/>
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#4a8000] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7.5L5.5 10.5L11.5 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <h1 className="text-[26px] font-bold text-[#1a2e0a] leading-tight mb-3">
            You've been invited!
          </h1>
          <p className="text-[15px] text-[#5a6a4a] leading-6 max-w-xs">
            Someone shared their schedule with you. Connect your Google Calendar to find the best time to meet.
          </p>
        </div>

        {/* Info card */}
        <div className="mx-5 rounded-2xl bg-white border border-[#e0e8d0] p-4 mb-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#f0f7e6] flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7" stroke="#4a8000" strokeWidth="1.5"/>
                <path d="M9 8v5M9 6h.01" stroke="#4a8000" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#2a3e1a] mb-0.5">How it works</p>
              <p className="text-[13px] text-[#7a8a6a] leading-5">
                We'll compare your calendars and highlight the windows where you're both free — no data is stored.
              </p>
            </div>
          </div>
        </div>

        {/* Their calendar loaded indicator */}
        <div className="mx-5 rounded-2xl bg-white border border-[#e0e8d0] px-4 py-3 mb-8 shadow-sm flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#8fcc5a] flex-shrink-0" />
          <p className="text-[13px] text-[#4a6030] flex-1">
            Their calendar is loaded <span className="text-[#888]">({theirBlocks.length} events)</span>
          </p>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 8.5L6.5 11L12 5" stroke="#4a8000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center mt-auto pb-10">
          <button
            onClick={handleConnect}
            className="bg-[#4a8000] rounded-2xl px-8 py-4 flex items-center justify-center gap-2.5 text-[16px] font-semibold text-white cursor-pointer shadow-md active:scale-[0.98] transition-transform"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="1" y="3" width="18" height="14" rx="3" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.5"/>
              <path d="M1 7h18" stroke="white" strokeWidth="1.5"/>
              <circle cx="6" cy="2" r="1.5" fill="white"/>
              <circle cx="14" cy="2" r="1.5" fill="white"/>
            </svg>
            Connect Google Calendar
          </button>
          <p className="text-center text-[12px] text-[#9aaa8a] mt-3">
            Read-only access · No events stored
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] max-w-sm mx-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-14 pb-5">
        <button onClick={() => router.replace('/home')} className="text-[14px] text-[#c8f97a] cursor-pointer w-12">
          Back
        </button>
        <span className="text-[16px] font-semibold text-white">When you're both free</span>
        <div className="w-12" />
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-6 h-6 border-2 border-[#c8f97a] border-t-transparent rounded-full animate-spin" />
          <p className="text-[14px] text-[#555]">Finding your overlap...</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mx-6 mb-5 bg-[#111] rounded-xl p-4 border border-[#1e1e1e] flex">
            {[
              [freeSlots.length, 'free slots'],
              [14, 'days checked'],
              ['1h', 'per slot'],
            ].map(([val, label], i, arr) => (
              <div key={label} className={`flex-1 flex flex-col items-center ${i < arr.length - 1 ? 'border-r border-[#1e1e1e]' : ''}`}>
                <span className="text-[22px] font-bold text-[#c8f97a]">{val}</span>
                <span className="text-[11px] text-[#555] mt-0.5">{label}</span>
              </div>
            ))}
          </div>

          {/* Day strip */}
          <div className="flex gap-2 overflow-x-auto px-6 pb-5 no-scrollbar">
            {days.map((day) => {
              const count = freeSlots.filter((s) => isSameDay(s.start, day)).length;
              const active = isSameDay(day, selectedDay);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => { setSelectedDay(day); setSelectedSlot(null); }}
                  className={`flex-shrink-0 w-13 py-2.5 rounded-xl flex flex-col items-center border cursor-pointer transition-colors ${
                    active ? 'bg-[#c8f97a] border-[#c8f97a]' : 'bg-[#111] border-[#1e1e1e]'
                  }`}
                >
                  <span className={`text-[10px] tracking-wide mb-0.5 ${active ? 'text-[#0a0a0a]' : 'text-[#555]'}`}>
                    {format(day, 'EEE')}
                  </span>
                  <span className={`text-lg font-semibold ${active ? 'text-[#0a0a0a]' : 'text-[#666]'}`}>
                    {format(day, 'd')}
                  </span>
                  {count > 0 && (
                    <span className={`text-[10px] font-semibold mt-1 ${active ? 'text-[#0a0a0a]' : 'text-[#c8f97a]'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Slot list */}
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <p className="text-[15px] font-medium text-white mb-4">
              {format(selectedDay, 'EEEE, MMMM d')}
            </p>

            {slotsForDay.length === 0 ? (
              <div className="flex flex-col items-center mt-10 gap-2">
                <p className="text-[16px] text-[#444]">No mutual free time this day</p>
                <p className="text-[13px] text-[#333]">Try another day</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {slotsForDay.map((slot, i) => {
                  const selected = selectedSlot?.start.getTime() === slot.start.getTime();
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedSlot(selected ? null : slot)}
                      className={`w-full flex justify-between items-center rounded-xl p-4 border cursor-pointer transition-colors ${
                        selected
                          ? 'bg-[#1a2e0a] border-[#c8f97a]'
                          : 'bg-[#111] border-[#1e1e1e]'
                      }`}
                    >
                      <span className={`text-[16px] font-medium ${selected ? 'text-[#c8f97a]' : 'text-[#888]'}`}>
                        {format(slot.start, 'h:mm a')} – {format(slot.end, 'h:mm a')}
                      </span>
                      {selected && <span className="text-[#c8f97a]">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Book bar */}
          {selectedSlot && (
            <div className="px-5 pb-10 pt-3 border-t border-[#1e1e1e] flex items-center gap-4">
              {!booked ? (
                <>
                  <div className="flex-1">
                    <p className="text-[13px] text-[#888]">{format(selectedSlot.start, 'EEE, MMM d')}</p>
                    <p className="text-[16px] font-semibold text-white">
                      {format(selectedSlot.start, 'h:mm a')} – {format(selectedSlot.end, 'h:mm a')}
                    </p>
                  </div>
                  <button
                    onClick={handleBook}
                    disabled={booking}
                    className="bg-[#c8f97a] rounded-xl px-5 py-3.5 text-[15px] font-bold text-[#0a0a0a] disabled:opacity-50 cursor-pointer"
                  >
                    {booking ? (
                      <div className="w-5 h-5 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Add to Calendar'
                    )}
                  </button>
                </>
              ) : (
                <div className="flex-1 text-center">
                  <p className="text-[#c8f97a] font-semibold text-base">Added to your calendar!</p>
                  <p className="text-[#555] text-[13px] mt-1">
                    {format(selectedSlot.start, 'EEE, MMM d')} · {format(selectedSlot.start, 'h:mm a')}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function OverlapPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#c8f97a]/30 border-t-[#c8f97a] rounded-full animate-spin"></div>
        </main>
      }
    >
      <OverlapContent />
    </Suspense>
  );
}
