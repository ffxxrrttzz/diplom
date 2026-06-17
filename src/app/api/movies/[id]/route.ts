// src/app/api/movies/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatMovieForFrontend } from '@/lib/kinopoisk/adapter'

/**
 * GET /api/movies/[id]
 * 
 * Получает детализированную информацию о фильме по ID.
 * 
 * Параметры:
 * - id: внутренний ID фильма в нашей базе (не external_id!)
 * 
 * Пример:
 * GET /api/movies/42
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const movieId = parseInt(id, 10)
    
    if (isNaN(movieId)) {
      return NextResponse.json(
        { error: 'Invalid movie ID' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Получаем фильм из базы
    const { data: movie, error } = await supabase
      .from('content')
      .select('*')
      .eq('id', movieId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Фильм не найден
        return NextResponse.json(
          { error: 'Movie not found' },
          { status: 404 }
        )
      }
      console.error('❌ Database error:', error)
      throw new Error(`Database error: ${error.message}`)
    }
    
    // Форматируем для фронтенда
    const formatted = formatMovieForFrontend(movie)
    
    return NextResponse.json({
      success: true,
      data: formatted
    })
    
  } catch (error: any) {
    console.error('❌ Error fetching movie:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch movie', 
        message: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/movies/[id]
 * 
 * Обновляет информацию о фильме (только для админов).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Реализация по необходимости
  return NextResponse.json(
    { error: 'Not implemented' },
    { status: 501 }
  )
}

/**
 * DELETE /api/movies/[id]
 * 
 * Удаляет фильм из базы (только для админов).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Реализация по необходимости
  return NextResponse.json(
    { error: 'Not implemented' },
    { status: 501 }
  )
}