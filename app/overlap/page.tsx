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
      <div className="min-h-screen bg-[#0a0a0a] max-w-sm mx-auto px-6 flex flex-col">
        <div className="flex items-center justify-between pt-14 pb-8">
          <button onClick={() => router.replace('/')} className="text-[14px] text-[#c8f97a] cursor-pointer">
            Back
          </button>
          <span className="text-[16px] font-semibold text-white">When you're both free</span>
          <div className="w-10" />
        </div>

        <div className="bg-[#111] rounded-xl p-4 border border-[#1e1e1e] mb-6">
          <p className="text-[14px] text-[#888] leading-5">
            Someone shared their availability with you. Connect your Google Calendar to see when you're both free.
          </p>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-[#c8266a]" />
          <span className="text-[13px] text-[#666]">Their busy times ({theirBlocks.length} events)</span>
        </div>

        <button
          onClick={handleConnect}
          className="w-full bg-[#c8f97a] rounded-2xl py-[18px] flex items-center justify-center text-base font-semibold text-[#0a0a0a] cursor-pointer mt-auto mb-10"
        >
          Connect Google Calendar
        </button>
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
