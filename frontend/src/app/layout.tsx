import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../styles/globals.css';
import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, theme } from 'antd';
import { RoleProvider } from '@/context/RoleContext';
import Providers from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'cyrillic'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'cyrillic'],
});

export const metadata: Metadata = {
  title: 'Service Desk — Корпоративный портал',
  description: 'Современный интранет-портал для управления заявками и задачами.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-800 min-h-full`}>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              algorithm: theme.defaultAlgorithm,
              token: {
                colorPrimary: '#0052cc', // Jira corporate blue
                colorSuccess: '#36b37e', // Success green
                colorWarning: '#ffab00', // Warning yellow
                colorError: '#ff5630',   // Error red
                colorInfo: '#0052cc',    // Info blue
                colorTextBase: '#172b4d', // Dark slate text
                colorBgBase: '#ffffff',  // White container background
                borderRadius: 8,
                fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
              },
              components: {
                Layout: {
                  bodyBg: '#f4f5f7', // Jira-like background
                  headerBg: '#ffffff',
                  siderBg: '#fafbfc',
                },
                Menu: {
                  itemBg: 'transparent',
                  itemSelectedBg: '#deebff',
                  itemSelectedColor: '#0052cc',
                  itemHoverBg: '#f4f5f7',
                  itemMarginBlock: 4,
                  itemBorderRadius: 6,
                },
                Table: {
                  colorBgContainer: '#ffffff',
                  colorBorderSecondary: '#dfe1e6',
                  headerBg: '#f4f5f7',
                  headerColor: '#5e6c84',
                },
                Card: {
                  colorBgContainer: '#ffffff',
                  colorBorderSecondary: '#dfe1e6',
                },
                Modal: {
                  contentBg: '#ffffff',
                  headerBg: '#ffffff',
                },
                DatePicker: {
                  activeBorderColor: '#0052cc',
                  hoverBorderColor: '#2684ff',
                }
              },
            }}
          >
            <RoleProvider>
              <Providers>{children}</Providers>
            </RoleProvider>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
