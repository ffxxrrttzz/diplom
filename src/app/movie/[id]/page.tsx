import { createClient } from '@/lib/supabase/server';
import { MoviePageClient } from '@/components/movie/MoviePageClient';

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contentId = parseInt(id);

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
    return <div className="text-center py-20 text-2xl">Контент не найден</div>;
  }

  return <MoviePageClient content={content} />;
}