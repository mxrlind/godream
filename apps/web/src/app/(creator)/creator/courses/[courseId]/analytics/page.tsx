import { CourseAnalyticsPage } from '@/features/creator/CourseAnalyticsPage';

export const metadata = { title: 'Analytics do Curso — GoDream' };

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <CourseAnalyticsPage courseId={courseId} />;
}
