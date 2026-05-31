import { VerifyCertificateClient } from './VerifyCertificateClient';

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <VerifyCertificateClient code={code} />;
}
