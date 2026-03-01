import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'KKTC Galeri Yönetim',
  description: 'KKTC araç galerileri için yönetim paneli',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        <NextTopLoader color="hsl(var(--primary))" height={2} showSpinner={false} speed={150} />
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
