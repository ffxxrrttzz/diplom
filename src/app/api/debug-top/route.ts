// src/app/api/debug-top/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const API_KEY = process.env.KINOPOISK_API_KEY
  if (!API_KEY) {
    return NextResponse.json({ error: 'Missing KINOPOISK_API_KEY' }, { status: 500 })
  }

  // 🔥 Делаем ТОЧНО такой же запрос, как в синхронизации
  const url = `https://kinopoiskapiunofficial.tech/api/v2.2/films/top?type=TOP_100_POPULAR_FILMS&page=1`
  
  console.log(`🔍 Debug request to: ${url}`)
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })
    
    const contentType = response.headers.get('content-type')
    const rawText = await response.text()
    
    // Пробуем распарсить как JSON
    let jsonData = null
    let parseError = null
    try {
      jsonData = JSON.parse(rawText)
    } catch (e: any) {
      parseError = e.message
    }
    
    return NextResponse.json({
      url,
      status: response.status,
      ok: response.ok,
      contentType,
      isJson: contentType?.includes('application/json'),
      bodyLength: rawText.length,
      bodyPreview: rawText.slice(0, 500),
      parsedJson: jsonData,
      parseError,
      message: response.ok && jsonData 
        ? '✅ Запрос успешный! Можешь запускать синхронизацию.' 
        : '❌ Запрос вернул ошибку. Смотри bodyPreview выше.'
    })
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Request failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}