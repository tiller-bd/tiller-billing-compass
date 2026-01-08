// src/app/api/clients/[id]/route.ts
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id: parseInt(id) },
      include: {
        projects: {
          include: {
            department: true,
            category: true,
            bills: { orderBy: { tentativeBillingDate: 'asc' } }
          },
          orderBy: { startDate: 'desc' }
        }
      }
    });

    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    // Calculate ranking relative to other clients
    const allClients = await prisma.project.groupBy({
      by: ['clientId'],
      _sum: { totalProjectValue: true }
    });
    const sorted = allClients.sort((a, b) => Number(b._sum.totalProjectValue) - Number(a._sum.totalProjectValue));
    const rank = sorted.findIndex(c => c.clientId === client.id) + 1;

    return NextResponse.json({ ...client, rank });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}