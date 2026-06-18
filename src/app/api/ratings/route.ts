// src/app/api/ratings/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Ratings API is working',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Rating received (placeholder)',
      data: body,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON' },
      { status: 400 }
    );
  }
}