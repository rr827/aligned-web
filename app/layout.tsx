import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ErrorBoundary from './components/ErrorBoundary';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'ClearSlot — Find time together',
  description: 'Share your availability privately. Find when you are both free. No account required.',
  openGraph: {
    title: 'ClearSlot',
    description: 'Find time together without the back and forth.',
    url: 'https://clearslot.net',
    siteName: 'ClearSlot',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className={`${dmSans.className} antialiased`}>
        <ErrorBoundary>{children}</ErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
