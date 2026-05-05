import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';

async function authenticate(req: NextRequest) {
  const token = getTokenFromHeaders(req.headers);
  if (!token) return null;
  return verifyToken(token);
}

// GET /api/trips/[id]/members
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const members = await prisma.tripMember.findMany({
    where: { tripId: parseInt(id) },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } }
  });
  return NextResponse.json({ members });
}

// POST /api/trips/[id]/members - Add member
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  try {
    const { email, role, costSharePct } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const member = await prisma.tripMember.create({
      data: { tripId: parseInt(id), userId: user.id, role: role || 'member', costSharePct: costSharePct || 0 },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } }
    });
    return NextResponse.json({ member }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to add member';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/trips/[id]/members - Update member
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  try {
    const { userId, role, costSharePct } = await req.json();
    await prisma.tripMember.updateMany({
      where: { tripId: parseInt(id), userId: parseInt(userId) },
      data: { role, costSharePct: parseFloat(costSharePct) || 0 }
    });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

// DELETE /api/trips/[id]/members - Remove member
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  try {
    await prisma.tripMember.deleteMany({
      where: { tripId: parseInt(id), userId: parseInt(userId) }
    });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
