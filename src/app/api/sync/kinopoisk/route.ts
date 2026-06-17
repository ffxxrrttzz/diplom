// src/app/api/sync/kinopoisk/route.ts
import { NextRequest, NextResponse } from 'next/server'
// ❌ УДАЛИ ЭТО: import { createClient } from '@/lib/supabase/server'
// ✅ ДОБАВЬ ЭТО:
import { createAdminClient } from '@/lib/supabase/admin' 

import { kinopoisk } from '@/lib/kinopoisk/client'
import { adaptKinopoiskToDB } from '@/lib/kinopoisk/adapter'

export async function POST(request: NextRequest) {
  console.log('🚀 Starting sync...')
  
  try {
    const { searchParams } = new URL(request.url)
    const adminToken = searchParams.get('admin_token')
    
    // Проверка токена
    if (adminToken !== process.env.ADMIN_SYNC_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 🔥 ИСПОЛЬЗУЕМ АДМИН-КЛИЕНТ (обходит RLS)
    const supabase = createAdminClient()
    console.log('✅ Supabase admin client created')
    
    // Получаем данные из Kinopoisk
    console.log('📡 Fetching from Kinopoisk...')
    const kinopoiskResponse = await kinopoisk.getTopPopular(1)
    console.log(`📦 Received ${kinopoiskResponse.films.length} films`)
    
    // Преобразуем данные
    const moviesToUpsert = kinopoiskResponse.films.map(adaptKinopoiskToDB)
    
    // Сохраняем в базу
    console.log('💾 Saving to Supabase...')
    
    const { data, error, count } = await supabase
      .from('content')
      .upsert(moviesToUpsert, { 
        onConflict: 'external_id',
        count: 'exact'
      })
      .select()
    
    if (error) {
      console.error('❌ Database error:', error)
      throw new Error(`DB error: ${error.message}`)
    }
    
    const savedCount = data?.length || count || 0
    console.log(`✅ Successfully saved ${savedCount} movies`)
    
    return NextResponse.json({
      success: true,
      message: `✅ Синхронизировано ${savedCount} фильмов`,
      count: savedCount
    })
    
  } catch (error: any) {
    console.error('❌ SYNC ERROR:', error.message)
    return NextResponse.json(
      { error: 'Sync failed', message: error.message }, 
      { status: 500 }
    )
  }
}

// GET для тестов (оставляем как был)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filmId = searchParams.get('film_id')
    if (!filmId) return NextResponse.json({ error: 'Missing film_id' }, { status: 400 })
    
    const film = await kinopoisk.getFilm(parseInt(filmId))
    const adapted = adaptKinopoiskToDB(film)
    return NextResponse.json({ success: true, adapted })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}