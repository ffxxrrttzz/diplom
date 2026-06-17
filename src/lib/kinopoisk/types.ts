// src/lib/kinopoisk/types.ts

export interface KinopoiskPerson {
  nameRu: string
  nameEn?: string
  professionText: string
  professionKey?: string
}

export interface KinopoiskCountry {
  country: string
}

export interface KinopoiskGenre {
  genre: string
}

export interface KinopoiskFilm {
  filmId: number
  nameRu: string
  nameEn?: string
  nameOriginal?: string
  posterUrl: string
  posterUrlPreview?: string
  backdropUrl?: string
  description?: string
  shortDescription?: string
  ratingKinopoisk?: number
  ratingImdb?: number
  ratingAwait?: number
  ratingFilmCritics?: number
  filmLength?: number
  countries: KinopoiskCountry[]
  genres: KinopoiskGenre[]
  persons: KinopoiskPerson[]
  type: 'FILM' | 'TV_SHOW'
  year?: string
  endYear?: string
  ageRating?: string
  isSeries?: boolean
  seasonsCount?: number
  episodesCount?: number
  webUrl?: string
}

export interface KinopoiskTopResponse {
  films: KinopoiskFilm[]
  pagesCount: number
  page: number
  filmsCount: number
}

export interface KinopoiskSearchResponse {
  films: KinopoiskFilm[]
  pagesCount: number
  page: number
  filmsCount: number
}

export interface KinopoiskSingleFilmResponse extends KinopoiskFilm {
  // Дополнительные поля для детальной информации
  reviewsCount?: number
  ratingGoodReview?: number
  ratingGoodReviewVoteCount?: number
}

// Типы для нашей базы данных
export interface MovieDB {
  id?: number
  external_id: number
  title: string
  original_title?: string
  type: 'movie' | 'series' | 'anime' | 'cartoon'
  release_year?: number
  description?: string
  poster_url?: string
  backdrop_url?: string
  rating?: number
  duration?: number
  age_rating?: string
  countries: string[]
  genres: string[]
  persons: Record<string, string[]>
  created_at?: string
  updated_at?: string
}