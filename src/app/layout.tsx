import './globals.css';

import type { Metadata } from 'next';
import { Geist /* Geist_Mono */ } from 'next/font/google';

import { ModalProvider } from './components/shared/modal';
import { PopupProvider } from './components/shared/popup-v2';
import { ToastContainer } from './components/shared/toast';
import { StableLayout } from './components/stable-layout';
import { AppProvider } from './providers/AppProvider';
import { StoreProvider } from './providers/StoreProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  fallback: ['system-ui', 'arial'],
});

// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

export const metadata: Metadata = {
  title: 'Image Tagger',
  description: 'Tag images with text to identify things',
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon-128.png', sizes: '128x128', type: 'image/png' },
      { url: '/favicon-196.png', sizes: '196x196', type: 'image/png' },
    ],
    other: [
      {
        rel: 'apple-touch-icon',
        url: '/favicon-196.png',
      },
      {
        rel: 'mask-icon',
        url: '/favicon.svg',
      },
    ],
  },
};

export default function Root({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={geistSans.className}>
        <StoreProvider>
          <AppProvider>
            <ModalProvider>
              <PopupProvider>
                <StableLayout>{children}</StableLayout>
              </PopupProvider>
              <ToastContainer />
            </ModalProvider>
          </AppProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
