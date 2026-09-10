import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Navbar } from '@/components/layout/Navbar';
import { ActiveWorkoutBanner } from '@/components/layout/ActiveWorkoutBanner';
import { PwaRegister } from '@/components/layout/PwaRegister';
import { AuthGate } from '@/components/auth/AuthGate';

export const metadata: Metadata = {
  title: 'CRUX - Entrenamiento de Escalada',
  description: 'Planifica, ejecuta y registra entrenamientos de escalada personalizados y tests físicos.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CRUX',
  },
};

export const viewport: Viewport = {
  themeColor: '#D9532F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon-192.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="antialiased flex flex-col min-h-screen bg-chalk-100 dark:bg-graphite-950 text-graphite-900 dark:text-graphite-100 font-sans transition-colors duration-200">
        <PwaRegister />
        <AuthGate>
          <Header />
          <ActiveWorkoutBanner />
          <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 pb-24">
            {children}
          </main>
          <Navbar />
        </AuthGate>
      </body>
    </html>
  );
}
