import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({ include: { bills: true } });
    
    const totalBudget = projects.reduce((sum, p) => sum + Number(p.totalProjectValue || 0), 0);
    const totalReceived = projects.flatMap(p => p.bills).reduce((sum, b) => sum + Number(b.receivedAmount || 0), 0);
    
    return NextResponse.json({
      totalBudget,
      totalReceived,
      totalRemaining: totalBudget - totalReceived,
      activeCount: projects.length // Ensure this isn't filtering out your data
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}