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

    const KP_API_KEY = process.env.KINOPOISK_API_KEY;
    if (!KP_API_KEY) return NextResponse.json({ error: 'KINOPOISK_API_KEY не настроен' }, { status: 500 });

    const baseUrl = 'https://kinopoiskapiunofficial.tech/api/v2.2';

    const { data: seriesList } = await supabase
      .from('content')
      .select('id, external_id, title')
      .in('type', ['series', 'anime'])
      .gt('external_id', 100000)
      .order('id', { ascending: true });

    console.log(`🔍 Найдено сериалов: ${seriesList?.length || 0}`);

    let processed = 0;
    let seasonsAdded = 0;
    let episodesAdded = 0;
    let errors = 0;

    for (const series of seriesList || []) {
      processed++;
      const kpId = series.external_id;
      if (!kpId) continue;

      await new Promise(r => setTimeout(r, 600)); // увеличенная задержка

      const seasonsUrl = `${baseUrl}/films/${kpId}/seasons`;
      console.log(`📡 [${kpId}] ${series.title}`);

      const res = await fetch(seasonsUrl, {
        headers: { 'X-API-KEY': KP_API_KEY },
      });

      let seasonsData: any = { seasons: [] };

      if (res.ok) {
        seasonsData = await res.json();
        console.log(`   → /seasons вернул ${seasonsData.seasons?.length || 0} сезонов`);
      } else {
        console.warn(`   ⚠️ HTTP ${res.status} для /seasons`);
      }

      let seasons = seasonsData.seasons || [];

      // Fallback — пробуем получить сезоны из детального фильма
      if (seasons.length === 0) {
        await new Promise(r => setTimeout(r, 300));
        const detailRes = await fetch(`${baseUrl}/films/${kpId}`, {
          headers: { 'X-API-KEY': KP_API_KEY },
        });

        if (detailRes.ok) {
          const detail = await detailRes.json();
          if (detail.seasons && detail.seasons.length > 0) {
            seasons = detail.seasons;
            console.log(`   → Fallback /films вернул ${seasons.length} сезонов`);
          }
        }
      }

      if (seasons.length === 0) {
        console.log(`   ❌ Нет данных о сезонах для ${series.title}`);
        continue;
      }

      for (const season of seasons) {
        const seasonNumber = season.number || season.seasonNumber || 1;

        const { data: existingSeason } = await supabase
          .from('seasons')
          .select('id')
          .eq('content_id', series.id)
          .eq('season_number', seasonNumber)
          .maybeSingle();

        let seasonId: number;

        if (existingSeason) {
          seasonId = existingSeason.id;
        } else {
          const { data: newSeason, error } = await supabase
            .from('seasons')
            .insert({
              content_id: series.id,
              season_number: seasonNumber,
              tmdb_id: null,
            })
            .select('id')
            .single();

          if (error) {
            console.error(`   ❌ Ошибка сезона ${seasonNumber}:`, error.message);
            errors++;
            continue;
          }

          seasonId = newSeason!.id;
          seasonsAdded++;
          console.log(`   ✅ Добавлен сезон ${seasonNumber}`);
        }

        // Эпизоды
        const episodes = season.episodes || [];
        for (const ep of episodes) {
          const epNumber = ep.episodeNumber || ep.number || 1;
          const episodeData = {
            season_id: seasonId,
            episode_number: epNumber,
            title: ep.nameRu || ep.nameEn || `Эпизод ${epNumber}`,
            description: ep.synopsis || ep.description || null,
            poster_path: ep.posterUrl || null,
            tmdb_id: null,
          };

          const { error: epError } = await supabase
            .from('episodes')
            .upsert(episodeData, { 
              onConflict: 'season_id,episode_number', 
              ignoreDuplicates: true 
            });

          if (!epError) episodesAdded++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      seasonsAdded,
      episodesAdded,
      errors,
      message: `Обработано: ${processed} | Сезонов: ${seasonsAdded} | Эпизодов: ${episodesAdded}`
    });

  } catch (error: any) {
    console.error('❌ Критическая ошибка:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}