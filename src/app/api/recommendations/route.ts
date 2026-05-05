import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';

async function authenticate(req: NextRequest) {
  const token = getTokenFromHeaders(req.headers);
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await prisma.$queryRawUnsafe(`CALL RecommendDestinations(${payload.userId})`);
    const recommendations = await prisma.recommendationLog.findMany({
      where: { userId: payload.userId },
      include: { destination: true },
      orderBy: [{ createdAt: 'desc' }, { score: 'desc' }],
      take: 5
    });
    return NextResponse.json({ recommendations });
  } catch {
    // Fallback: top-rated destinations
    const destinations = await prisma.destination.findMany({
      include: {
        placeReviews: { select: { rating: true } },
        _count: { select: { itineraryDays: true } }
      },
      take: 5
    });
    const results = destinations.map(d => ({
      destination: d,
      score: d.placeReviews.length > 0
        ? d.placeReviews.reduce((s, r) => s + Number(r.rating), 0) / d.placeReviews.length
        : 3.0,
      explanation: `${d.city}, ${d.country} - Popular destination with ${d._count.itineraryDays} planned visits`
    }));
    return NextResponse.json({ recommendations: results });
  }
}
