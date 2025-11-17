import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next.js with next-intl Demo',
  description: 'Demonstration of internationalization with next-intl',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
