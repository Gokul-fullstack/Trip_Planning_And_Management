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
  if (!payload.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Try to get cached stats first
  let stats = await prisma.adminStatsCache.findMany();

  // If empty, refresh
  if (stats.length === 0) {
    try {
      await prisma.$queryRawUnsafe('CALL sp_refresh_admin_stats()');
      stats = await prisma.adminStatsCache.findMany();
    } catch {
      // If stored proc not available, compute directly
      const totalUsers = await prisma.user.count();
      const totalTrips = await prisma.trip.count();
      const totalHotelBookings = await prisma.hotelBooking.count();
      const totalFlightBookings = await prisma.flightBooking.count();

      const destinations = await prisma.destination.findMany({
        include: { _count: { select: { itineraryDays: true } } },
        orderBy: { itineraryDays: { _count: 'desc' } },
        take: 10
      });

      const trips = await prisma.trip.findMany({
        include: { expenses: true },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({
        stats: {
          summary: { total_users: totalUsers, total_trips: totalTrips, total_bookings: totalHotelBookings + totalFlightBookings },
          popular_destinations: destinations.map(d => ({ city: d.city, country: d.country, trip_count: d._count.itineraryDays })),
          budget_vs_actual: trips.map(t => ({
            trip_name: t.name,
            budget: Number(t.totalBudget),
            actual: t.expenses.reduce((sum, e) => sum + Number(e.amount), 0)
          }))
        }
      });
    }
  }

  const result: Record<string, unknown> = {};
  stats.forEach(s => { result[s.metricName] = s.metricValue; });
  return NextResponse.json({ stats: result });
}
