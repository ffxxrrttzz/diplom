// src/app/api/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;

  return NextResponse.json({
    status: 'ok',
    message: 'Auth API is working',
    path: path,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    return NextResponse.json({
      success: true,
      message: 'POST request received',
      data: body,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON body' },
      { status: 400 }
    );
  }
}

// Опционально: можно добавить другие методы
export async function PUT() {
  return NextResponse.json({ message: 'PUT method not implemented yet' }, { status: 501 });
}