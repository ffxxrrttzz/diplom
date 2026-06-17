// src/lib/kinopoisk/client.ts
import { 
  KinopoiskFilm, 
  KinopoiskTopResponse, 
  KinopoiskSearchResponse,
  KinopoiskSingleFilmResponse 
} from './types'
import { rawKinopoiskFetch } from './fetcher' // ← Импортируем чистый fetch

// Просто обёртка с типами
export const kinopoisk = {
  getFilm: (id: number) => rawKinopoiskFetch<KinopoiskSingleFilmResponse>(`/films/${id}`),
  getTopPopular: (page = 1) => rawKinopoiskFetch<KinopoiskTopResponse>('/films/top', { type: 'TOP_100_POPULAR_FILMS', page }),
  getTopSeries: (page = 1) => rawKinopoiskFetch<KinopoiskTopResponse>('/films/top', { type: 'TOP_100_POPULAR_SERIES', page }),
  getTopAnime: (page = 1) => rawKinopoiskFetch<KinopoiskTopResponse>('/films/top', { type: 'TOP_100_POPULAR_ANIME', page }),
  search: (query: string, page = 1) => rawKinopoiskFetch<KinopoiskSearchResponse>('/films/search-by-keyword', { keyword: query, page }),
  getNewReleases: (page = 1) => rawKinopoiskFetch<KinopoiskTopResponse>('/films/top', { type: 'TOP_100_NEW_FILMS', page }),
}

export async function checkKinopoiskConnection() {
  try {
    await kinopoisk.getFilm(301)
    return { ok: true, message: '✅ Подключение успешно' }
  } catch (error: any) {
    return { ok: false, message: `❌ Ошибка: ${error.message}` }
  }
}