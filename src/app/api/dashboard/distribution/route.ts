import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        category: true,
      },
    });

    const categoryCounts: Record<string, number> = {};
    projects.forEach((p) => {
      const catName = p.category.name;
      categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
    });

    const distribution = Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value,
      // Assigning colors based on category name keywords
      color: name.toLowerCase().includes('software') 
        ? 'hsl(173, 80%, 36%)' 
        : 'hsl(190, 70%, 40%)',
    }));

    return NextResponse.json(distribution);
  } catch (error) {
    console.error('Distribution API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}