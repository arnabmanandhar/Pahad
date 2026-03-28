import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/shared/AppProviders';

export const metadata: Metadata = {
  title: 'Pahad',
  description: 'Community Mental Health Screening',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
