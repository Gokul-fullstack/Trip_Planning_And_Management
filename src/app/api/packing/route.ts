import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';

async function authenticate(req: NextRequest) {
  const token = getTokenFromHeaders(req.headers);
  if (!token) return null;
  return verifyToken(token);
}

// GET - generate or fetch packing list for a trip
export async function GET(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tripId = searchParams.get('tripId');
  if (!tripId) return NextResponse.json({ error: 'tripId required' }, { status: 400 });

  const tid = parseInt(tripId);

  // Check for existing packing list
  let items = await prisma.tripPackingItem.findMany({
    where: { tripId: tid, userId: payload.userId },
    orderBy: { itemName: 'asc' }
  });

  // If no list exists, generate from stored procedure
  if (items.length === 0) {
    try {
      const generated: Array<{ item_name: string; category: string; reason: string }> = await prisma.$queryRawUnsafe(`CALL GeneratePackingList(${tid})`);
      if (Array.isArray(generated) && generated.length > 0) {
        const data = (Array.isArray(generated[0]) ? generated[0] : generated).map((g: { item_name: string }) => ({
          tripId: tid,
          userId: payload.userId,
          itemName: g.item_name,
          isPacked: false,
          isCustom: false,
        }));
        if (data.length > 0) {
          await prisma.tripPackingItem.createMany({ data });
          items = await prisma.tripPackingItem.findMany({
            where: { tripId: tid, userId: payload.userId },
            orderBy: { itemName: 'asc' }
          });
        }
      }
    } catch {
      // If stored proc fails, use default packing items
      const defaults = await prisma.packingItem.findMany({ where: { isDefault: true } });
      const data = defaults.map(d => ({
        tripId: tid, userId: payload.userId, itemName: d.name, isPacked: false, isCustom: false,
      }));
      if (data.length > 0) {
        await prisma.tripPackingItem.createMany({ data });
        items = await prisma.tripPackingItem.findMany({
          where: { tripId: tid, userId: payload.userId },
          orderBy: { itemName: 'asc' }
        });
      }
    }
  }

  return NextResponse.json({ items });
}

// POST - add custom item or toggle packed status
export async function POST(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();

  if (data.action === 'toggle' && data.id) {
    const item = await prisma.tripPackingItem.findUnique({ where: { id: data.id } });
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    const updated = await prisma.tripPackingItem.update({
      where: { id: data.id },
      data: { isPacked: !item.isPacked }
    });
    return NextResponse.json({ item: updated });
  }

  if (data.itemName && data.tripId) {
    const item = await prisma.tripPackingItem.create({
      data: {
        tripId: data.tripId,
        userId: payload.userId,
        itemName: data.itemName,
        isPacked: false,
        isCustom: true,
      }
    });
    return NextResponse.json({ item }, { status: 201 });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
