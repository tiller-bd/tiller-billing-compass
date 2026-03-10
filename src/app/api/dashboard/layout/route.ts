import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mergeWithDefaults } from '@/lib/dashboard-config';

export async function GET() {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  const row = await prisma.userDashboardLayout.findUnique({
    where: { userId: session.id },
  });

  if (!row) return NextResponse.json(null);

  return NextResponse.json(mergeWithDefaults(row.layout as any));
}

export async function PATCH(request: Request) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  const body = await request.json();

  const row = await prisma.userDashboardLayout.upsert({
    where:  { userId: session.id },
    update: { layout: body },
    create: { userId: session.id, layout: body },
  });

  return NextResponse.json(mergeWithDefaults(row.layout as any));
}
