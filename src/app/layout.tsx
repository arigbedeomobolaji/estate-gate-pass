import type { Metadata, Viewport } from 'next';
import { Inter, Roboto } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '500', '700', '900'], variable: '--font-roboto-var', display: 'swap' });

export const metadata: Metadata = {
  title: 'Estate Access Control',
  description: 'Visitor access permit and gate management for NAF Base',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Estate Access' },
  icons: { icon: '/icons/icon-192x192.png', apple: '/icons/icon-152x152.png' },
};

export const viewport: Viewport = {
  themeColor: '#0e2038',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${roboto.variable}`}>
      <body>
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
