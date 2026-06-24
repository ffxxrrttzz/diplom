import type { Metadata } from 'next';

import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';


export const metadata: Metadata = {
  title: 'Kritika',
  description: 'Смотри, оценивай, обсуждай фильмы и сериалы',
  icons: {
    icon: '/Group1.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body className="bg-zinc-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}