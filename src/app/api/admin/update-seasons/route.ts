// app/api/admin/update-seasons/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !['admin', 'moderator'].includes(profile.role || '')) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const { data: seriesList } = await supabase
      .from('content')
      .select('id, external_id, title')
      .in('type', ['series', 'anime'])
      .not('external_id', 'is', null)
      .limit(50); // ограничение для безопасности

    if (!seriesList?.length) {
      return NextResponse.json({ message: 'Нет сериалов для обработки' });
    }

    let seasonsAdded = 0;
    let episodesAdded = 0;
    let processed = 0;
    const apiKey = process.env.KINOPOISK_API_KEY!;
    const baseUrl = process.env.KINOPOISK_BASE_URL!;

    for (const series of seriesList) {
      processed++;
      try {
        const res = await fetch(
          `${baseUrl}/api/v2.2/films/${series.external_id}/seasons`,
          {
            headers: { 'X-API-KEY': apiKey },
            signal: AbortSignal.timeout(8000),
          }
        );

        if (!res.ok) continue;

        const data = await res.json();

        for (const season of (data.items || [])) {
          const { data: seasonRecord } = await supabase
            .from('seasons')
            .upsert({
              content_id: series.id,
              season_number: season.number,
            }, { onConflict: 'content_id,season_number' })
            .select('id')
            .single();

          if (seasonRecord?.id) {
            seasonsAdded++;

            for (const ep of (season.episodes || [])) {
              await supabase.from('episodes').upsert({
                season_id: seasonRecord.id,
                episode_number: ep.episodeNumber,
                title: ep.nameRu || ep.nameEn || `Эпизод ${ep.episodeNumber}`,
                description: ep.synopsis || null,
                poster_path: ep.posterUrl || null,
              }, { onConflict: 'season_id,episode_number' });

              episodesAdded++;
            }
          }
        }
      } catch (err) {
        console.error(`Ошибка сериала ${series.title}:`, err);
        continue; // продолжаем с остальными
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      seasonsAdded,
      episodesAdded,
      message: `Обработано ${processed} сериалов`
    });

  } catch (error: any) {
    console.error('Season Update Error:', error);
    return NextResponse.json({ error: error.message || 'Внутренняя ошибка' }, { status: 500 });
  }
}