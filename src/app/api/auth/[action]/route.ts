import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, verifyPassword, signToken, verifyToken, getTokenFromHeaders } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.pathname.split('/').pop();

  if (action === 'register') return handleRegister(req);
  if (action === 'login') return handleLogin(req);
  if (action === 'profile') return handleProfileUpdate(req);

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function GET(req: NextRequest) {
  const token = getTokenFromHeaders(req.headers);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, avatarUrl: true, preferredCurrency: true, isAdmin: true, createdAt: true }
  });

  return NextResponse.json({ user });
}

async function handleRegister(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, isAdmin: true }
    });

    const token = await signToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin });
    return NextResponse.json({ user, token }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleLogin(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const token = await signToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin });
    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin, preferredCurrency: user.preferredCurrency, avatarUrl: user.avatarUrl },
      token
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleProfileUpdate(req: NextRequest) {
  try {
    const token = getTokenFromHeaders(req.headers);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const data = await req.json();
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        name: data.name,
        avatarUrl: data.avatarUrl,
        preferredCurrency: data.preferredCurrency,
      },
      select: { id: true, email: true, name: true, avatarUrl: true, preferredCurrency: true, isAdmin: true }
    });
    return NextResponse.json({ user });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Profile update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
