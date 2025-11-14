import type { Metadata } from 'next';
import './globals.css';
import { LocaleProvider, LanguageSwitcher, LocaleSync } from 'turbopack-file-list-plugin/client';

export const metadata: Metadata = {
  title: 'Turbopack File List Demo',
  description: 'Demo app with Turbopack file list plugin',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LocaleProvider>
          <LocaleSync />
          <LanguageSwitcher />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
