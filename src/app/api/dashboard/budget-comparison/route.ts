import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        bills: true,
      },
    });

    const comparison = projects.map((p) => {
      const totalValue = Number(p.totalProjectValue || 0);
      const received = p.bills.reduce((sum, b) => sum + Number(b.receivedAmount || 0), 0);
      const remaining = totalValue - received;

      return {
        // Shorten long names for chart readability
        name: p.projectName.length > 15 ? p.projectName.substring(0, 15) + '...' : p.projectName,
        received: received / 1000000, // Amount in Millions
        remaining: remaining / 1000000, // Amount in Millions
      };
    });

    return NextResponse.json(comparison);
  } catch (error) {
    console.error('Budget Comparison API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}