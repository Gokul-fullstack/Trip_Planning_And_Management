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

  const notifications = await prisma.notification.findMany({
    where: { userId: payload.userId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: payload.userId, isRead: false }
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PUT(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, markAllRead } = await req.json();

  if (markAllRead) {
    await prisma.notification.updateMany({
      where: { userId: payload.userId, isRead: false },
      data: { isRead: true }
    });
    return NextResponse.json({ message: 'All marked as read' });
  }

  if (id) {
    await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true }
    });
    return NextResponse.json({ message: 'Marked as read' });
  }

  return NextResponse.json({ error: 'id or markAllRead required' }, { status: 400 });
}
