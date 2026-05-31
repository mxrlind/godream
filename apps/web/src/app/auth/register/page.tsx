import { RegisterForm } from '@/features/auth/RegisterForm';

export const metadata = { title: 'Criar conta — GoDream' };

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(0,229,255,0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(124,92,255,0.06) 0%, transparent 70%)',
        }}
      />
      <RegisterForm />
    </main>
  );
}
