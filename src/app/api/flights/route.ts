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

  const { searchParams } = new URL(req.url);
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');

  const where: Record<string, unknown> = {};
  if (origin) where.origin = origin;
  if (destination) where.destination = destination;

  const flights = await prisma.flight.findMany({ where, orderBy: { basePrice: 'asc' } });
  return NextResponse.json({ flights });
}

export async function POST(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    const flight = await prisma.flight.findUnique({ where: { id: data.flightId } });
    if (!flight) return NextResponse.json({ error: 'Flight not found' }, { status: 404 });

    const pnr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const booking = await prisma.flightBooking.create({
      data: {
        tripId: data.tripId,
        flightId: data.flightId,
        userId: payload.userId,
        pnr,
        pricePaid: data.pricePaid || flight.basePrice,
        class: data.class || 'Economy',
        status: 'Confirmed',
      },
      include: { flight: true }
    });
    return NextResponse.json({ booking }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Booking failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
