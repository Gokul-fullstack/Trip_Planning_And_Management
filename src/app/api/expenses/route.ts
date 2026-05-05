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
  const tripId = searchParams.get('tripId');
  if (!tripId) return NextResponse.json({ error: 'tripId required' }, { status: 400 });

  const expenses = await prisma.expense.findMany({
    where: { tripId: parseInt(tripId) },
    include: {
      payer: { select: { id: true, name: true, avatarUrl: true } },
      splits: { include: { user: { select: { id: true, name: true } } } }
    },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json({ expenses });
}

export async function POST(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    // Trigger trg_auto_split_expense will create splits automatically
    const expense = await prisma.expense.create({
      data: {
        tripId: data.tripId,
        paidBy: payload.userId,
        description: data.description,
        amount: data.amount,
        currency: data.currency || 'USD',
        category: data.category,
      },
      include: { payer: { select: { id: true, name: true } } }
    });
    return NextResponse.json({ expense }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
