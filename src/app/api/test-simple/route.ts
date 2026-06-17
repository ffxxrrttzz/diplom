// src/app/api/test-simple/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const res = await fetch('https://kinopoiskapiunofficial.tech/api/v2.2/films/top?type=TOP_100_POPULAR_FILMS&page=1', {
    headers: {
      'X-API-KEY': process.env.KINOPOISK_API_KEY!,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', // ← Ключевой заголовок
    },
  })
  const text = await res.text()
  return new NextResponse(text, { 
    status: res.status, 
    headers: { 'content-type': res.headers.get('content-type') || 'text/plain' } 
  })
}