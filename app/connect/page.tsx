'use client';

import { useState } from 'react';
import { startGoogleAuth } from '@/lib/auth';

export default function ConnectPage() {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    await startGoogleAuth('/home');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] max-w-sm mx-auto px-7 flex flex-col items-center justify-center">
      <h1 className="text-[40px] font-extralight text-white tracking-[-2px] mb-3">aligned</h1>
      <p className="text-[15px] text-[#555] mb-10 text-center">
        Connect your Google Calendar to get started.
      </p>

      <div className="bg-[#111] rounded-xl p-3.5 mb-8 border border-[#1e1e1e] w-full">
        <p className="text-[13px] text-[#555] leading-[18px]">
          No account. No data stored. Event details never leave your browser.
        </p>
      </div>

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
  );
}
