import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const bills = await prisma.projectBill.findMany({
    where: { status: 'PAID', receivedAmount: { gt: 0 } },
    orderBy: { receivedDate: 'desc' },
    take: 5,
    include: { project: true }
  });

  const formatted = bills.map(b => ({
    projectName: b.project.projectName,
    amount: Number(b.receivedAmount),
    date: b.receivedDate
  }));

  return NextResponse.json(formatted);
}