// app/api/admin/update-kinopoisk/route.ts
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

    const body = await request.json();
    const { mode = 'top', limit = 20, requirePoster = true } = body;

    // Используем стабильный Kinopoisk Unofficial API
    const KP_API_KEY = process.env.KINOPOISK_API_KEY;
    const baseUrl = 'https://kinopoiskapiunofficial.tech/api/v2.2';

    let url = '';
    if (mode === 'top') {
      url = `${baseUrl}/films/top?type=TOP_250_BEST_FILMS&page=1`;
    } else {
      url = `${baseUrl}/films?order=NUM_VOTE&type=ALL&limit=${limit}`;
    }

    console.log(`📡 Запрос к Kinopoisk Unofficial: ${url}`);

    const response = await fetch(url, {
      headers: {
        'X-API-KEY': KP_API_KEY!,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Kinopoisk API: ${response.status} - ${text}`);
    }

    const data = await response.json();
    const films = mode === 'top' ? data.films : data.items || [];

    let processed = 0, updated = 0, skipped = 0;

    for (const film of films.slice(0, Number(limit))) {
      processed++;

      const posterUrl = film.posterUrl || film.poster?.previewUrl || film.poster?.url;

      if (requirePoster && !posterUrl) {
        skipped++;
        continue;
      }

      let title = (film.nameRu || film.nameOriginal || `Unknown [${film.kinopoiskId}]`).trim();
      const originalTitle = (film.nameOriginal || film.nameEn)?.trim() || null;

      if (title.includes('Unknown') || title.length < 3) {
        title = originalTitle || title;
      }

      const contentData = {
        external_id: film.kinopoiskId,
        title,
        original_title: originalTitle,
        type: film.type === 'FILM' ? 'movie' : 'series',
        release_year: film.year,
        description: film.description || null,
        poster_url: posterUrl,
        rating: film.ratingKinopoisk || film.rating?.kinopoisk,
        duration: film.filmLength,
        age_rating: film.ratingAgeLimits,
        countries: film.countries?.map((c: any) => c.country) || null,
        genres: film.genres?.map((g: any) => g.genre) || null,
      };

      const { error } = await supabase
        .from('content')
        .upsert(contentData, { onConflict: 'external_id' });

      if (!error) updated++;
    }

    return NextResponse.json({
      success: true,
      processed,
      updated,
      skipped,
      message: `✅ Синхронизация завершена (Kinopoisk Unofficial). Обработано: ${processed}, Обновлено: ${updated}, Пропущено: ${skipped}`
    });

  } catch (error: any) {
    console.error('❌ FULL ERROR:', error);
    return NextResponse.json({ 
      error: error.message || 'Внутренняя ошибка сервера' 
    }, { status: 500 });
  }
}