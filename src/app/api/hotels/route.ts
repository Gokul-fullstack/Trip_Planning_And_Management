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
  const destId = searchParams.get('destinationId');
  const minRating = searchParams.get('minRating');

  const where: Record<string, unknown> = {};
  if (destId) where.destinationId = parseInt(destId);
  if (minRating) where.rating = { gte: parseFloat(minRating) };

  const hotels = await prisma.hotel.findMany({
    where,
    include: { destination: { select: { city: true, country: true } } },
    orderBy: { rating: 'desc' }
  });
  return NextResponse.json({ hotels });
}

export async function POST(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    // Transactional booking
    const booking = await prisma.$transaction(async (tx) => {
      const hotel = await tx.hotel.findUnique({ where: { id: data.hotelId } });
      if (!hotel) throw new Error('Hotel not found');

      const nights = Math.ceil((new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime()) / (1000 * 60 * 60 * 24));
      const totalPrice = Number(hotel.pricePerNight) * nights * (data.rooms || 1);

      return tx.hotelBooking.create({
        data: {
          tripId: data.tripId,
          hotelId: data.hotelId,
          userId: payload.userId,
          checkIn: new Date(data.checkIn),
          checkOut: new Date(data.checkOut),
          rooms: data.rooms || 1,
          totalPrice,
          status: 'Confirmed',
        },
        include: { hotel: true }
      });
    });
    return NextResponse.json({ booking }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Booking failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
