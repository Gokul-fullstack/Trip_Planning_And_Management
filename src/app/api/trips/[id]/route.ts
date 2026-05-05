import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';

async function authenticate(req: NextRequest) {
  const token = getTokenFromHeaders(req.headers);
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id: parseInt(id) },
    include: {
      owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
      itineraryDays: {
        include: { destination: true, activities: { orderBy: { time: 'asc' } } },
        orderBy: { dayNumber: 'asc' }
      },
      hotelBookings: { include: { hotel: true } },
      flightBookings: { include: { flight: true } },
      expenses: { include: { splits: { include: { user: { select: { id: true, name: true } } } } } },
    }
  });

  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  return NextResponse.json({ trip });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  try {
    const data = await req.json();
    const trip = await prisma.trip.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        totalBudget: data.totalBudget,
        status: data.status,
        coverImage: data.coverImage,
      }
    });
    return NextResponse.json({ trip });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  await prisma.trip.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ message: 'Trip deleted' });
}
