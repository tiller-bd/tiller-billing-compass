import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const bills = await prisma.projectBill.findMany({
    where: { 
      status: { not: 'PAID' },
      tentativeBillingDate: { gte: new Date() } 
    },
    orderBy: { tentativeBillingDate: 'asc' },
    take: 5,
    include: { project: true }
  });

  const formatted = bills.map(b => ({
    projectName: b.project.projectName,
    amount: Number(b.billAmount),
    dueDate: b.tentativeBillingDate
  }));

  return NextResponse.json(formatted);
}