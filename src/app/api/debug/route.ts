// src/app/api/debug/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const API_KEY = process.env.KINOPOISK_API_KEY
  const url = 'https://kinopoiskapiunofficial.tech/api/v2.2/films/301'
  
  const response = await fetch(url, {
    headers: {
      'X-API-KEY': API_KEY!,
      'Content-Type': 'application/json',
    },
  })
  
  const contentType = response.headers.get('content-type')
  const rawText = await response.text()
  
  return NextResponse.json({
    status: response.status,
    contentType,
    bodyPreview: rawText.slice(0, 500), // Первые 500 символов
    isJson: contentType?.includes('application/json'),
  })
}