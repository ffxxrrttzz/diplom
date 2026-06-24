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
    const { mode = 'popular', limit = 30, forceNew = false } = body;

    const KP_API_KEY = process.env.KINOPOISK_API_KEY;
    if (!KP_API_KEY) return NextResponse.json({ error: 'KINOPOISK_API_KEY не настроен' }, { status: 500 });

    const baseUrl = 'https://kinopoiskapiunofficial.tech/api/v2.2';
    const listUrl = `${baseUrl}/films?order=NUM_VOTE&type=ALL&limit=${limit}`;

    console.log(`📡 Запрос списка: ${listUrl}`);

    const listRes = await fetch(listUrl, { headers: { 'X-API-KEY': KP_API_KEY } });
    if (!listRes.ok) throw new Error(`List API error: ${listRes.status}`);

    const listData = await listRes.json();
    const films = listData.items || [];

    let processed = 0;
    let added = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const film of films) {
      processed++;
      const kpId = film.kinopoiskId || film.filmId;
      if (!kpId) {
        skipped++;
        continue;
      }

      // === ДЕТАЛЬНЫЙ ЗАПРОС ===
      await new Promise(r => setTimeout(r, 350)); // rate-limit защита

      const detailUrl = `${baseUrl}/films/${kpId}`;
      console.log(`📡 Детали для ${kpId} → ${film.nameRu}`);

      const detailRes = await fetch(detailUrl, {
        headers: { 'X-API-KEY': KP_API_KEY },
      });

      if (!detailRes.ok) {
        console.error(`Не удалось получить детали ${kpId}`);
        skipped++;
        continue;
      }

      const detail = await detailRes.json();

      const posterUrl = detail.posterUrl || detail.poster?.url || film.posterUrl;
      if (!posterUrl) {
        skipped++;
        continue;
      }

      // Тип контента
      const typeMap: Record<string, string> = {
        FILM: 'movie',
        TV_SERIES: 'series',
        MINI_SERIES: 'series',
        VIDEO: 'movie',
        UNKNOWN: 'movie',
      };

      const apiType = detail.type || film.type || 'FILM';
      const contentType = typeMap[apiType] || 'movie';

      const realKpId = detail.kinopoiskId || detail.filmId || kpId;

      // external_id
      const externalId = forceNew
        ? -Math.abs(Date.now() % 100000000 + Math.floor(Math.random() * 100000))
        : realKpId;

      const contentData = {
        external_id: externalId,
        title: (detail.nameRu || detail.nameOriginal || film.nameRu || 'Без названия').trim(),
        original_title: detail.nameOriginal || null,
        type: contentType,
        release_year: detail.year ? parseInt(String(detail.year)) : null,
        description: detail.description || null,
        poster_url: posterUrl,
        backdrop_url: detail.coverUrl || null,
        rating: detail.ratingKinopoisk ? parseFloat(String(detail.ratingKinopoisk)) : null,
        duration: detail.filmLength ? parseInt(String(detail.filmLength)) : null,
        age_rating: detail.ratingAgeLimits ? detail.ratingAgeLimits.replace('age', '') : null,
        countries: detail.countries?.map((c: any) => c.country) || [],
        genres: detail.genres?.map((g: any) => g.genre) || [],
        directors: detail.directors?.map((d: any) => d.name) || [],
        actors: detail.actors?.slice(0, 12).map((a: any) => a.name) || [],
        persons: detail.persons || null,
        last_synced_at: new Date().toISOString(),
      };

      console.log(`→ Сохранение: ${contentData.title} | type: ${contentType} | kpId: ${realKpId}`);

      // Проверка существования
      const { data: existing } = await supabase
        .from('content')
        .select('id, external_id')
        .eq('external_id', realKpId)   // ← важно!
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('content')
          .update(contentData)
          .eq('id', existing.id);

        if (error) {
          console.error(`Ошибка обновления ${contentData.title}:`, error.message);
          errors++;
        } else {
          updated++;
        }
      } else {
        const { error } = await supabase
          .from('content')
          .insert(contentData);

        if (error) {
          console.error(`Ошибка вставки ${contentData.title}:`, error.message);
          errors++;
        } else {
          added++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      added,
      updated,
      skipped,
      errors,
      message: `✅ Добавлено: ${added} | Обновлено: ${updated} | Пропущено: ${skipped} | Ошибок: ${errors}`
    });

  } catch (error: any) {
    console.error('❌ Критическая ошибка:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}