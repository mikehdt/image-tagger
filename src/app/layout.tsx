import './globals.css';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { DataProvider } from './providers/DataProvider';
import { StoreProvider } from './providers/StoreProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Tagger',
  description: 'Taggy tag',
};

export default function Root({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StoreProvider>
          <DataProvider>
            <div className="mx-auto min-h-screen max-w-400 items-center justify-items-center px-4 font-[family-name:var(--font-geist-sans)]">
              {children}
            </div>
          </DataProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
