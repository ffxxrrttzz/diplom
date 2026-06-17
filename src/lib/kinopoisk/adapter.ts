// src/lib/kinopoisk/adapter.ts
import { KinopoiskFilm, MovieDB } from './types'

/**
 * 🔥 Парсит длительность из разных форматов Kinopoisk в минуты (число)
 * Примеры: "02:36" → 156, "120" → 120, "2ч 36мин" → 156, "1ч" → 60
 */
function parseDuration(duration: any): number | undefined {
  // Если нет данных — возвращаем undefined
  if (!duration) return undefined
  
  // Если уже число — возвращаем как есть
  if (typeof duration === 'number') return duration
  
  const str = String(duration).trim()
  
  // Формат "02:36" или "2:36" (часы:минуты)
  const timeMatch = str.match(/^(\d+):(\d+)$/)
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10)
    const minutes = parseInt(timeMatch[2], 10)
    return hours * 60 + minutes
  }
  
  // Формат "120" (просто минуты строкой)
  if (/^\d+$/.test(str)) {
    return parseInt(str, 10)
  }
  
  // Формат "2ч 36мин" или "2ч" или "36мин"
  const hoursMatch = str.match(/(\d+)\s*ч/)
  const minutesMatch = str.match(/(\d+)\s*мин/)
  
  if (hoursMatch || minutesMatch) {
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0
    return hours * 60 + minutes
  }
  
  // Не удалось распарсить — логируем и возвращаем undefined
  console.log(`⚠️ Could not parse duration: "${str}"`)
  return undefined
}

/**
 * Преобразует данные из Kinopoisk API в формат для нашей базы данных
 */
export function adaptKinopoiskToDB(film: KinopoiskFilm): MovieDB {
  // Определяем тип контента
  const type = mapContentType(film.type, film.genres, film.nameRu || film.nameEn || '')
  
  // Безопасная группировка людей
  const persons = groupPersonsByProfession(film.persons)
  
  // Извлекаем массивы стран и жанров (с защитой)
  const countries = Array.isArray(film.countries) 
    ? film.countries.map(c => c?.country).filter(Boolean) 
    : []
    
  const genres = Array.isArray(film.genres) 
    ? film.genres.map(g => g?.genre).filter(Boolean) 
    : []
  
  // Парсим год выпуска
  const releaseYear = film.year ? parseInt(film.year, 10) : undefined
  
  // 🔥 Парсим длительность в минуты
  const duration = parseDuration(film.filmLength)
  
  // Выбираем лучший рейтинг
  const rating = film.ratingKinopoisk || film.ratingImdb || film.ratingAwait
  
  return {
    external_id: film.filmId,
    title: film.nameRu || 'Без названия',
    original_title: film.nameOriginal || film.nameEn,
    type,
    release_year: releaseYear || undefined,
    description: film.description || film.shortDescription,
    poster_url: film.posterUrl,
    backdrop_url: film.backdropUrl,
    rating: rating ? Math.round(rating * 10) / 10 : undefined,
    duration, // 🔥 Теперь это число или undefined
    age_rating: film.ageRating,
    countries,
    genres,
    persons,
  }
}

function mapContentType(
  apiType: 'FILM' | 'TV_SHOW', 
  genres: { genre: string }[] | undefined,
  title: string
): MovieDB['type'] {
  if (!Array.isArray(genres)) return apiType === 'FILM' ? 'movie' : 'series'
  
  const genreNames = genres.map(g => g?.genre?.toLowerCase()).filter(Boolean)
  const titleLower = title.toLowerCase()
  
  // 🔥 Приоритет: аниме и мультфильмы
  if (genreNames.some(g => g?.includes('аниме')) || titleLower.includes('аниме')) {
    return 'anime'
  }
  if (genreNames.some(g => g?.includes('мультфильм') || g?.includes('анимация')) || 
      titleLower.includes('мульт') || titleLower.includes('анимация')) {
    return apiType === 'TV_SHOW' ? 'cartoon' : 'cartoon'
  }
  
  // 🔥 Если TV_SHOW, но в названии нет признаков сериала — это может быть фильм
  if (apiType === 'TV_SHOW') {
    const seriesKeywords = ['сезон', 'серия', 'эпизод', 'season', 'episode', 'serial']
    if (!seriesKeywords.some(keyword => titleLower.includes(keyword))) {
      return 'movie' // 🔥 Исправляем ложные сериалы
    }
  }
  
  return apiType === 'FILM' ? 'movie' : 'series'
}

function groupPersonsByProfession(persons: any): Record<string, string[]> {
  if (!Array.isArray(persons)) {
    return {}
  }
  
  const professionMap: Record<string, string> = {
    'режиссёр': 'director',
    'режиссер': 'director',
    'сценарист': 'writer',
    'продюсер': 'producer',
    'актер': 'actor',
    'актёр': 'actor',
    'актриса': 'actor',
    'оператор': 'cinematographer',
    'композитор': 'composer',
    'художник': 'artist',
  }
  
  const result: Record<string, string[]> = {}
  
  for (const person of persons) {
    if (!person || typeof person !== 'object') continue
    
    const name = person.nameRu || person.nameEn
    const profession = person.professionText || person.professionKey
    
    if (!name || !profession) continue
    
    const normalizedProfession = String(profession).toLowerCase().trim()
    const key = professionMap[normalizedProfession] || 'other'
    
    if (!result[key]) result[key] = []
    
    if (!result[key].includes(name)) {
      result[key].push(name)
    }
  }
  
  if (result.actor && result.actor.length > 10) {
    result.actor = result.actor.slice(0, 10)
  }
  
  return result
}

export function formatMovieForFrontend(movie: MovieDB) {
  return {
    ...movie,
    countries: movie.countries || [],
    genres: movie.genres || [],
    rating_display: movie.rating ? `${movie.rating.toFixed(1)}` : '—',
    poster_url: movie.poster_url || '/images/no-poster.jpg',
    persons: movie.persons || {},
  }
}