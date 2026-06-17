// src/app/api/test-kinopoisk/route.ts
import { NextResponse } from 'next/server'
import { checkKinopoiskConnection } from '@/lib/kinopoisk/client'

export async function GET() {
  const result = await checkKinopoiskConnection()
  return NextResponse.json(result)
}