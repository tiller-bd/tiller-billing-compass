import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        client: true,
        category: true,
        bills: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Projects API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}