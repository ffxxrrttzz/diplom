// supabase/functions/update-kinopoisk/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const KINOPOISK_API_KEY = Deno.env.get('KINOPOISK_API_KEY')
const BASE_URL = 'https://api.kinopoisk.dev'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

async function fetchJson(url: string, name = '') {
  try {
    const res = await fetch(url, { headers: { 'X-API-KEY': KINOPOISK_API_KEY! } })
    console.log(`[STATUS] ${res.status} ${name}`)
    return res.ok ? res.json() : null
  } catch (e) {
    console.warn(`[FAIL] ${name}`)
    return null
  }
}

async function upsertContentAndSeasons(kpData: any) {
  const externalId = kpData?.id
  if (!externalId) return { isNew: false }

  const title = kpData.name || kpData.title || `Unknown ${externalId}`

  const { data: existing } = await supabase
    .from('content')
    .select('id')
    .eq('external_id', externalId)
    .maybeSingle()

  const isNew = !existing

  // Актёры и режиссёры
  let directors: string[] = []
  let actors: string[] = []

  try {
    const staff = await fetchJson(`${BASE_URL}/v1.4/movie/${externalId}/staff`, 'Staff')
    if (staff?.items) {
      directors = staff.items
        .filter((p: any) => p.enProfession === 'director')
        .map((p: any) => p.nameRu || p.nameEn)
        .filter(Boolean)

      actors = staff.items
        .filter((p: any) => p.enProfession === 'actor')
        .slice(0, 25)
        .map((p: any) => p.nameRu || p.nameEn)
        .filter(Boolean)
    }
  } catch (e) {}

  const payload = {
    external_id: externalId,
    title,
    original_title: kpData.enName || kpData.alternativeName || null,
    type: kpData.type === 'tv-series' || kpData.type === 'mini-series' ? 'series'
         : kpData.type === 'anime' ? 'anime'
         : kpData.type === 'cartoon' ? 'cartoon' : 'movie',
    release_year: kpData.year || null,
    description: kpData.description || null,
    poster_url: kpData.poster?.url || kpData.poster?.previewUrl || null,
    backdrop_url: kpData.backdrop?.url || null,
    rating: kpData.rating?.kp || kpData.rating?.imdb || null,
    duration: kpData.movieLength || null,
    age_rating: kpData.ageRating || null,
    countries: kpData.countries?.map((c: any) => c.name) || [],
    genres: kpData.genres?.map((g: any) => g.name) || [],
    directors,
    actors,
    persons: null,
    last_synced_at: new Date().toISOString(),
  }

  let contentId: number

  if (existing) {
    await supabase.from('content').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', existing.id)
    contentId = existing.id
  } else {
    const { data: inserted } = await supabase
      .from('content')
      .insert(payload)
      .select('id')
      .single()
    contentId = inserted!.id
  }

  // === СЕЗОНЫ И ЭПИЗОДЫ ===
  if (['series', 'anime'].includes(payload.type)) {
    try {
      const seasonsData = await fetchJson(`${BASE_URL}/v1.4/movie/${externalId}/season`, `Seasons for ${externalId}`)
      
      if (seasonsData?.seasons?.length) {
        console.log(`[SEASONS] Found ${seasonsData.seasons.length} seasons for ${externalId}`)

        for (const season of seasonsData.seasons) {
          const { data: seasonRec } = await supabase
            .from('seasons')
            .upsert({ 
              content_id: contentId, 
              season_number: season.number 
            }, { onConflict: 'content_id,season_number' })
            .select('id')
            .single()

          let epCount = 0
          for (const ep of season.episodes || []) {
            await supabase.from('episodes').upsert({
              season_id: seasonRec!.id,
              episode_number: ep.number,
              title: ep.name || `S${season.number}E${ep.number}`,
              description: ep.description || null,
              poster_path: ep.poster?.url || null,
            }, { onConflict: 'season_id,episode_number' })
            epCount++
          }
          console.log(`[EPISODES] Season ${season.number} — ${epCount} episodes`)
        }
      } else {
        console.log(`[SEASONS] No seasons data for ${externalId}`)
      }
    } catch (e: any) {
      console.warn(`[SEASONS ERROR] ${externalId} — ${e.message}`)
    }
  }

  return { isNew }
}

serve(async (req) => {
  try {
    const { limit = 30 } = await req.json()

    let added = 0, processed = 0
    let startId = 1250000

    for (let i = 0; i < limit * 2.5 && processed < limit; i++) {
      const id = startId + Math.floor(Math.random() * 280000)

      const filmData = await fetchJson(`${BASE_URL}/v1.4/movie/${id}`, `Film ${id}`)
      if (!filmData || !filmData.id) continue

      const result = await upsertContentAndSeasons(filmData)
      processed++
      if (result.isNew) added++

      await new Promise(r => setTimeout(r, 130))
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed, 
      added, 
      message: `Обработано ${processed} тайтлов. Новых: ${added}` 
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error('[CRITICAL]', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})