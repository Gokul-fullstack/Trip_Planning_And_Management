import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';

async function authenticate(req: NextRequest) {
  const token = getTokenFromHeaders(req.headers);
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const base = searchParams.get('base') || 'USD';

  const rates = await prisma.exchangeRate.findMany({
    where: { fromCurrency: base }
  });
  return NextResponse.json({ rates, base });
}

export async function POST(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { amount, from, to } = await req.json();
  if (!amount || !from || !to) return NextResponse.json({ error: 'amount, from, to required' }, { status: 400 });

  if (from === to) return NextResponse.json({ converted: amount, rate: 1 });

  const rateRecord = await prisma.exchangeRate.findUnique({
    where: { fromCurrency_toCurrency: { fromCurrency: from, toCurrency: to } }
  });

  if (!rateRecord) {
    // Try reverse
    const reverse = await prisma.exchangeRate.findUnique({
      where: { fromCurrency_toCurrency: { fromCurrency: to, toCurrency: from } }
    });
    if (reverse) {
      const rate = 1 / Number(reverse.rate);
      return NextResponse.json({ converted: Math.round(amount * rate * 100) / 100, rate });
    }
    return NextResponse.json({ error: 'Rate not found' }, { status: 404 });
  }

  const rate = Number(rateRecord.rate);
  return NextResponse.json({ converted: Math.round(amount * rate * 100) / 100, rate });
}
