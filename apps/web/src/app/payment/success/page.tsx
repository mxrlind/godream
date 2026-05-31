import { Suspense } from 'react';
import { PaymentSuccessClient } from './PaymentSuccessClient';
import { Loader2 } from 'lucide-react';

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={36} className="animate-spin text-neon-cyan" />
            <p className="text-text-secondary text-sm font-medium">Verificando pagamento...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessClient />
    </Suspense>
  );
}
