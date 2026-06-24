// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'kinopoiskapiunofficial.tech' },
      { protocol: 'https', hostname: 'avatars.mds.yandex.net' },
      { protocol: 'https', hostname: 'zwnovnddgvoovvryaqlh.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.vercel.app' },
    ],
  },

  // Headers для решения CORS/PNA проблем с Supabase Storage
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // В проде можно заменить на 'https://diplom-five-mu.vercel.app'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, HEAD, OPTIONS',
          },
        ],
      },
    ]
  },
}

export default nextConfig