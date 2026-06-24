// app/movie/[id]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { MoviePageClient } from '@/components/movie/MoviePageClient';
import { notFound } from 'next/navigation';

export default async function MoviePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const contentId = parseInt(id);

  if (isNaN(contentId)) {
    notFound();
  }

  const supabase = await createClient();

  const { data: content } = await supabase
    .from('content')
    .select(`
      *,
      seasons (
        *,
        episodes (*)
      )
    `)
    .eq('id', contentId)
    .maybeSingle();

  if (!content) {
    notFound(); // красивая 404 страница Next.js
  }

  return <MoviePageClient content={content} />;
}