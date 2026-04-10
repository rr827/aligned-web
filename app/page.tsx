'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isConnected, startGoogleAuth } from '@/lib/auth';

export default function WelcomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected()) router.replace('/home');
  }, [router]);

  const handleConnect = async () => {
    setLoading(true);
    await startGoogleAuth();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#c8f97a] opacity-5 blur-3xl pointer-events-none" />

      <div className="relative max-w-sm mx-auto px-7 pt-24 pb-12 min-h-screen flex flex-col">
        <h1 className="text-[52px] font-extralight text-white tracking-[-2.5px] mb-3 leading-none">
          aligned
        </h1>
        <p className="text-2xl font-medium text-[#c8f97a] leading-8 mb-12">
          Find time with people
          <br />
          who matter.
        </p>

        <div className="mb-9">
          <p className="text-[11px] text-[#444] tracking-widest uppercase mb-5">How it works</p>
          {[
            ['01', 'Connect your calendar'],
            ['02', 'Share your availability as a link'],
            ['03', 'Friend opens it, see your overlap'],
            ['04', 'Pick a time, done'],
          ].map(([num, step]) => (
            <div key={num} className="flex items-start gap-4 mb-4">
              <span className="text-[11px] text-[#c8f97a] font-semibold tracking-wide mt-0.5 w-5">
                {num}
              </span>
              <span className="text-[15px] text-[#888] flex-1 leading-snug">{step}</span>
            </div>
          ))}
        </div>

        <div className="bg-[#111] rounded-xl p-3.5 mb-8 border border-[#1e1e1e]">
          <p className="text-[13px] text-[#555] leading-[18px]">
            No account. No data stored. Event details never leave your browser.
          </p>
        </div>

        <div className="mt-auto">
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full bg-[#c8f97a] rounded-2xl py-[18px] flex items-center justify-center text-base font-semibold text-[#0a0a0a] disabled:opacity-40 transition-opacity cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
            ) : (
              'Connect Google Calendar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
