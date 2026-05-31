import { LessonPage } from '@/features/courses/LessonPage';

export default async function Page({ params }: { params: Promise<{ slug: string; lessonId: string }> }) {
  const { slug, lessonId } = await params;
  return <LessonPage slug={slug} lessonId={lessonId} />;
}
