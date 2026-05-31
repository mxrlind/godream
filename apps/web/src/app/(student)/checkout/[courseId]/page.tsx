import { CheckoutPage } from '@/features/checkout/CheckoutPage';

export const metadata = { title: 'Finalizar compra · GoDream' };

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <CheckoutPage courseId={courseId} />;
}
