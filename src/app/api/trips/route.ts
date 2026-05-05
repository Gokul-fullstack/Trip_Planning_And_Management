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

  const trips = await prisma.trip.findMany({
    where: {
      OR: [
        { ownerId: payload.userId },
        { members: { some: { userId: payload.userId } } }
      ]
    },
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      _count: { select: { itineraryDays: true, expenses: true } }
    },
    orderBy: { startDate: 'asc' }
  });

  return NextResponse.json({ trips });
}

export async function POST(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    const trip = await prisma.trip.create({
      data: {
        name: data.name,
        ownerId: payload.userId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        totalBudget: data.totalBudget || 0,
        status: data.status || 'Planning',
        coverImage: data.coverImage,
        members: {
          create: { userId: payload.userId, role: 'owner', costSharePct: 100 }
        }
      },
      include: { members: true }
    });
    return NextResponse.json({ trip }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to create trip';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
