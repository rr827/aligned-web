'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import { loadToken, clearToken } from '@/lib/auth';
import { fetchBusyBlocks, BusyBlock } from '@/lib/calendar';
import { buildShareLink } from '@/lib/payload';
import AvailabilityGrid from '@/components/AvailabilityGrid';

export default function HomePage() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<BusyBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [copied, setCopied] = useState(false);

  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const loadCalendar = useCallback(async () => {
    const token = loadToken();
    if (!token) { router.replace('/'); return; }

    setLoading(true);
    setError(null);
    try {
      const busyBlocks = await fetchBusyBlocks(token, 14);
      setBlocks(busyBlocks);
    } catch {
      setError('Could not load calendar. Click to retry.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadCalendar(); }, [loadCalendar]);

  const handleShare = async () => {
    if (blocks.length === 0) return;
    const link = buildShareLink(blocks);

    if (navigator.share) {
      try {
        await navigator.share({
          text: `Here is my availability, tap to find a time that works for both of us:\n\n${link}`,
        });
        return;
      } catch { /* fall through to clipboard */ }
    }

    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    if (!confirm('Disconnect your Google Calendar?')) return;
    clearToken();
    router.replace('/');
  };

  const dayBlocks = blocks.filter(
    (b) => format(new Date(b.start), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col max-w-sm mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start px-6 pt-14 pb-5">
        <div>
          <h1 className="text-[28px] font-extralight text-white tracking-[-1px]">aligned</h1>
          <p className="text-[12px] text-[#444] mt-0.5">{format(new Date(), 'MMMM yyyy')}</p>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-[13px] text-[#333] mt-1.5 cursor-pointer"
        >
          Disconnect
        </button>
      </div>

      {/* Date strip */}
      <div className="flex gap-2 overflow-x-auto px-6 pb-5 no-scrollbar">
        {dates.map((date) => {
          const active = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          return (
            <button
              key={date.toISOString()}
              onClick={() => setSelectedDate(date)}
              className={`flex-shrink-0 w-12 py-1.5 rounded-xl flex flex-col items-center border cursor-pointer transition-colors ${
                active
                  ? 'border-[#c8f97a]'
                  : 'bg-[#111] border-[#1e1e1e]'
              }`}
            >
              <span className={`text-[10px] tracking-wide mb-0.5 ${active ? 'text-[#c8f97a]' : 'text-[#555]'}`}>
                {format(date, 'EEE')}
              </span>
              <span className={`text-lg font-semibold ${active ? 'text-[#c8f97a]' : 'text-[#444]'}`}>
                {format(date, 'd')}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid area */}
      <div className="flex-1 overflow-y-auto px-6">
        <p className="text-[16px] font-medium text-white mb-5">
          {format(selectedDate, 'EEEE, MMMM d')}
        </p>

        {loading ? (
          <div className="flex flex-col items-center mt-16 gap-3">
            <div className="w-5 h-5 border-2 border-[#c8f97a] border-t-transparent rounded-full animate-spin" />
            <p className="text-[14px] text-[#444]">Reading your calendar...</p>
          </div>
        ) : error ? (
          <button
            onClick={loadCalendar}
            className="w-full text-center mt-16 text-[14px] text-[#c8f97a] cursor-pointer"
          >
            {error}
          </button>
        ) : (
          <AvailabilityGrid date={selectedDate} blocks={dayBlocks} />
        )}
      </div>

      {/* Events count */}
      {!loading && !error && (
        <p className="text-[11px] text-[#333] text-center py-2">
          {blocks.length === 0 ? 'No events found' : `${blocks.length} events across 14 days`}
        </p>
      )}

      {/* Share bar */}
      <div className="px-6 pb-10 pt-3 border-t border-[#111]">
        <button
          onClick={handleShare}
          disabled={loading || blocks.length === 0}
          className="w-full bg-[#c8f97a] rounded-2xl py-[18px] flex items-center justify-center text-base font-semibold text-[#0a0a0a] disabled:opacity-40 cursor-pointer transition-opacity"
        >
          {copied ? 'Link copied!' : 'Share my availability'}
        </button>
      </div>
    </div>
  );
}
