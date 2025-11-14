import type { Metadata } from 'next';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
