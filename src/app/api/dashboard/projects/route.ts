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