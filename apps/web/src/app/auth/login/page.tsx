import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/LoginForm';

export const metadata: Metadata = { title: 'Login' };

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-neon-purple/08 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-neon-cyan/06 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-neon-magenta/05 blur-[80px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />

      <LoginForm />
    </main>
  );
}
