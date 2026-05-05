import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';

async function authenticate(req: NextRequest) {
  const token = getTokenFromHeaders(req.headers);
  if (!token) return null;
  return verifyToken(token);
}

// GET price advice and alerts
export async function GET(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const routeKey = searchParams.get('routeKey');
  const action = searchParams.get('action');

  if (action === 'advice' && routeKey) {
    try {
      // Execute raw query directly to bypass Prisma adapter bug with stored procedures
      const results = await prisma.$queryRawUnsafe(`
        SELECT
          days_before_travel,
          ROUND(AVG(price), 2) AS avg_price,
          ROUND(MIN(price), 2) AS min_price,
          ROUND(MAX(price), 2) AS max_price,
          COUNT(*) AS sample_size,
          ROUND(
            (AVG(price) - MIN(price)) / NULLIF(AVG(price), 0) * 100, 1
          ) AS potential_savings_pct,
          CAST(RANK() OVER (ORDER BY AVG(price) ASC) AS UNSIGNED) AS price_rank
        FROM flight_price_history
        WHERE route_key = '${routeKey}'
        GROUP BY days_before_travel
        ORDER BY avg_price ASC
        LIMIT 10
      `);
      
      // Helper to serialize BigInt from raw queries
      const serializeBigInt = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeBigInt);
        if (obj instanceof Date) return obj.toISOString();
        if (typeof obj === 'object') {
          return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, serializeBigInt(v)]));
        }
        return obj;
      };
      
      return NextResponse.json({ advice: serializeBigInt(results) });
    } catch (e: any) {
      console.error('Error fetching advice:', e);
      return NextResponse.json({ error: 'Failed to fetch advice', details: e?.message || String(e) }, { status: 500 });
    }
  }

  if (action === 'alerts') {
    const alerts = await prisma.priceAlert.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ alerts });
  }

  // Return price history
  if (routeKey) {
    const history = await prisma.flightPriceHistory.findMany({
      where: { routeKey },
      orderBy: { daysBeforeTravel: 'asc' }
    });
    return NextResponse.json({ history });
  }

  return NextResponse.json({ error: 'routeKey required' }, { status: 400 });
}

// POST - create price alert
export async function POST(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { routeKey, desiredPrice } = await req.json();
    const alert = await prisma.priceAlert.create({
      data: { userId: payload.userId, routeKey, desiredPrice, isActive: true }
    });
    return NextResponse.json({ alert }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
