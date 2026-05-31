import { CourseEditor } from '@/features/creator/CourseEditor';

export const metadata = { title: 'Editor de curso · GoDream' };

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <CourseEditor courseId={courseId} />;
}
