import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Service Desk — Корпоративная система управления заявками',
  description: 'Интеллектуальная автоматизированная платформа обработки корпоративных обращений, согласований, HR процессов и финансовой аналитики.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="h-full antialiased text-slate-900 bg-slate-55">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
