import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';

async function authenticate(req: NextRequest) {
  const token = getTokenFromHeaders(req.headers);
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  const destinations = await prisma.destination.findMany({
    include: { _count: { select: { itineraryDays: true, hotels: true } } },
    orderBy: { city: 'asc' }
  });
  return NextResponse.json({ destinations });
}

export async function POST(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'search') {
    const { query } = await req.json();
    // Full-text search
    try {
      const results = await prisma.$queryRawUnsafe(
        `SELECT * FROM destinations WHERE MATCH(city, country, description) AGAINST(? IN NATURAL LANGUAGE MODE) LIMIT 10`,
        query
      );
      return NextResponse.json({ destinations: results });
    } catch {
      // Fallback to LIKE
      const results = await prisma.destination.findMany({
        where: {
          OR: [
            { city: { contains: query } },
            { country: { contains: query } },
          ]
        },
        take: 10
      });
      return NextResponse.json({ destinations: results });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
