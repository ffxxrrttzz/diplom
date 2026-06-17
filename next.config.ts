// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // 🔥 Разрешаем загрузку изображений с этих доменов
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kinopoiskapiunofficial.tech',
        pathname: '/images/**', // Разрешаем только папку /images/
      },
      {
        protocol: 'https',
        hostname: 'avatars.mds.yandex.net',
        pathname: '/get-kinopoisk-image/**', // Разрешаем только папку /images/
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Для аватарок из хранилища
      },
    ],
  },
}

export default nextConfig