import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId");
    const clientId = searchParams.get("clientId");
    const projectId = searchParams.get("projectId");

    const where: any = {};
    if (search) {
      where.OR = [
        { projectName: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (departmentId && departmentId !== "all") {
      where.departmentId = parseInt(departmentId);
    }
    if (clientId && clientId !== "all") {
      where.clientId = parseInt(clientId);
    }
    if (projectId && projectId !== "all") {
      where.id = parseInt(projectId);
    }

    const projects = await prisma.project.findMany({
      where,
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