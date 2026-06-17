// src/lib/kinopoisk/fetcher.ts

// 🔥 1. Получаем и валидируем переменные
const API_KEY = process.env.KINOPOISK_API_KEY?.trim()
const BASE_URL = process.env.KINOPOISK_BASE_URL?.trim()

// 🔥 2. Бросаем ошибку, если переменных нет
if (!API_KEY) {
  console.error('❌ FATAL: KINOPOISK_API_KEY is missing or empty in .env.local')
  throw new Error('KINOPOISK_API_KEY is not defined')
}
if (!BASE_URL) {
  console.error('❌ FATAL: KINOPOISK_BASE_URL is missing or empty in .env.local')
  throw new Error('KINOPOISK_BASE_URL is not defined')
}

// 🔥 3. Создаём новые константы с явным типом string
// Это "говорит" TypeScript, что дальше они точно не undefined
const API_KEY_VALIDATED: string = API_KEY
const BASE_URL_VALIDATED: string = BASE_URL

console.log(`[Kinopoisk Config] BASE_URL: ${BASE_URL_VALIDATED}`)

/**
 * Чистая функция для запросов к Kinopoisk API
 */
export async function rawKinopoiskFetch<T>(
  endpoint: string, 
  params?: Record<string, string | number>
): Promise<T> {
  // 🔥 4. Конструируем URL безопасно (используем валидированные константы)
  let fullUrl: string
  try {
    const baseUrl = BASE_URL_VALIDATED.replace(/\/$/, '')
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    fullUrl = `${baseUrl}${cleanEndpoint}`
    
    if (params) {
      const urlObj = new URL(fullUrl)
      Object.entries(params).forEach(([key, value]) => {
        urlObj.searchParams.append(key, String(value))
      })
      fullUrl = urlObj.toString()
    }
  } catch (urlError) {
    console.error('❌ URL Construction Error:', {
      BASE_URL: BASE_URL_VALIDATED,
      endpoint,
      error: urlError
    })
    throw new Error(`Failed to construct URL: ${urlError}`)
  }
  
  console.log(`🔍 [Kinopoisk] Fetching: ${fullUrl}`)
  
  // 🔥 5. Создаём заголовки через конструктор Headers (решает проблему типизации)
  const headers = new Headers()
  headers.set('X-API-KEY', API_KEY_VALIDATED)
  headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
  
  // 🔥 6. Делаем запрос
  const response = await fetch(fullUrl, {
    method: 'GET',
    headers, // ← Теперь TypeScript доволен
    cache: 'no-store',
  })
  
  const responseText = await response.text()
  const contentType = response.headers.get('content-type')
  
  // 🔥 7. Логирование ошибок
  if (!response.ok) {
    console.error(`❌ [Kinopoisk] HTTP ${response.status}:`, {
      url: fullUrl,
      contentType,
      bodyPreview: responseText.slice(0, 300)
    })
    throw new Error(`Kinopoisk API error ${response.status}`)
  }
  
  // 🔥 8. Проверка на HTML вместо JSON
  if (!contentType?.includes('application/json')) {
    console.error(`❌ [Kinopoisk] Expected JSON but got ${contentType}:`, {
      url: fullUrl,
      bodyPreview: responseText.slice(0, 300)
    })
    throw new Error(`Expected JSON, got ${contentType}: ${responseText.slice(0, 200)}...`)
  }
  
  return JSON.parse(responseText) as T
}