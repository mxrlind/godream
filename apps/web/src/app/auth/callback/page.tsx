import { Suspense } from 'react';
import { AuthCallbackClient } from './AuthCallbackClient';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
          <p className="text-text-secondary text-sm font-medium">Autenticando...</p>
        </div>
      </div>
    }>
      <AuthCallbackClient />
    </Suspense>
  );
}
