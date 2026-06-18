// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'kinopoiskapiunofficial.tech' },
      { protocol: 'https', hostname: 'avatars.mds.yandex.net' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.vercel.app' },
    ],
  },
}

export default nextConfig