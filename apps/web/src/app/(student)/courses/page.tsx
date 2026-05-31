import { Suspense } from 'react';
import { CoursesPage } from '@/features/courses/CoursesPage';

export const metadata = { title: 'Cursos — GoDream' };

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-1 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
        </div>
      }
    >
      <CoursesPage />
    </Suspense>
  );
}
