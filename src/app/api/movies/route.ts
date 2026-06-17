// src/app/api/movies/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatMovieForFrontend } from '@/lib/kinopoisk/adapter'

/**
 * GET /api/movies
 * 
 * Получает список фильмов из нашей базы данных.
 * 
 * Параметры запроса (query):
 * - type: фильтр по типу (movie, series, anime, cartoon)
 * - genre: фильтр по жанру
 * - search: поиск по названию
 * - sort: сортировка (rating, year, title)
 * - order: порядок (asc, desc)
 * - limit: количество результатов (макс. 100)
 * - offset: смещение для пагинации
 * 
 * Пример:
 * GET /api/movies?type=movie&genre=боевик&sort=rating&order=desc&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Парсим параметры
    const type = searchParams.get('type')
    const genre = searchParams.get('genre')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'release_year'
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    
    // Инициализируем клиент Supabase
    const supabase = await createClient()
    
    // Строим запрос
    let query = supabase
      .from('content')
      .select('*', { count: 'exact' })
    
    // Применяем фильтры
    if (type) {
      query = query.eq('type', type)
    }
    
    if (genre) {
      // Поиск по массиву жанров
      query = query.contains('genres', [genre])
    }
    
    if (search) {
      // Полнотекстовый поиск по названию
      query = query.ilike('title', `%${search}%`)
    }
    
    // Применяем сортировку и пагинацию
    query = query
      .order(sort as any, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)
    
    const { data: movies, error, count } = await query
    
    if (error) {
      console.error('❌ Database error:', error)
      throw new Error(`Database error: ${error.message}`)
    }
    
    // Форматируем данные для фронтенда
    const formattedMovies = (movies || []).map(formatMovieForFrontend)
    
    return NextResponse.json({
      success: true,
      data: formattedMovies,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: offset + limit < (count || 0),
      }
    })
    
  } catch (error: any) {
    console.error('❌ Error fetching movies:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch movies', 
        message: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/movies
 * 
 * Создаёт новый фильм в базе (только для админов).
 * Обычно используется для ручного добавления контента.
 */
export async function POST(request: NextRequest) {
  // Реализация по необходимости
  return NextResponse.json(
    { error: 'Not implemented. Use sync endpoint instead.' },
    { status: 501 }
  )
}