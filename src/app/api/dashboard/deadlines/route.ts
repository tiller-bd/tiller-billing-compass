import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";
  const departmentId = searchParams.get("departmentId");
  const clientId = searchParams.get("clientId");
  const projectId = searchParams.get("projectId");

  const projectWhere: any = {};

  if (search) {
    projectWhere.OR = [
      { projectName: { contains: search, mode: "insensitive" } },
      { client: { name: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (departmentId && departmentId !== "all") {
    projectWhere.departmentId = parseInt(departmentId);
  }
  if (clientId && clientId !== "all") {
    projectWhere.clientId = parseInt(clientId);
  }
  if (projectId && projectId !== "all") {
    projectWhere.id = parseInt(projectId);
  }

  const bills = await prisma.projectBill.findMany({
    where: { 
      status: { not: 'PAID' },
      tentativeBillingDate: { gte: new Date() },
      project: projectWhere,
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