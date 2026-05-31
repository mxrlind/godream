import type { Metadata, Viewport } from 'next';
import { Syne, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers';
import { Toaster } from 'react-hot-toast';

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', weight: ['400', '500', '600'] });

export const metadata: Metadata = {
  title: { template: '%s | GoDream', default: 'GoDream — Aprenda. Evolua. Conquiste.' },
  description: 'A plataforma de aprendizado gamificada que transforma seu estudo em uma aventura épica.',
  keywords: ['educação', 'cursos online', 'gamificação', 'aprendizado', 'programação', 'design'],
  authors: [{ name: 'GoDream' }],
  creator: 'GoDream',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'GoDream — Aprenda. Evolua. Conquiste.',
    description: 'A plataforma de aprendizado gamificada que transforma seu estudo em uma aventura épica.',
    siteName: 'GoDream',
  },
  twitter: { card: 'summary_large_image', title: 'GoDream', description: 'A plataforma de aprendizado gamificada' },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0e0e16',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${syne.variable} ${inter.variable} ${jetbrainsMono.variable} dark`} suppressHydrationWarning>
      <body className="bg-surface text-text-primary antialiased min-h-screen">
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1a1a2e',
                color: '#f0f0ff',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
              },
            }}
          />
        </Providers>
        {/* XP burst effects layer */}
        <div id="fx-layer" className="fixed inset-0 pointer-events-none z-[9999]" />
      </body>
    </html>
  );
}
