import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const departmentId = searchParams.get("departmentId");
    const year = searchParams.get("year");
    const clientId = searchParams.get("clientId");
    const projectId = searchParams.get("projectId");

    const where: any = {
      OR: [
        { billName: { contains: search, mode: "insensitive" } },
        { project: { projectName: { contains: search, mode: "insensitive" } } },
        {
          project: {
            client: { name: { contains: search, mode: "insensitive" } },
          },
        },
      ],
    };

    if (status && status !== "all") where.status = status;
    if (departmentId && departmentId !== "all")
      where.project = {
        ...where.project,
        departmentId: parseInt(departmentId),
      };
    if (clientId && clientId !== "all")
      where.project = {
        ...where.project,
        clientId: parseInt(clientId),
      };
    if (projectId && projectId !== "all")
      where.project = {
        ...where.project,
        id: parseInt(projectId),
      };
    if (year && year !== "all") {
      where.tentativeBillingDate = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      };
    }

    const bills = await prisma.projectBill.findMany({
      where,
      include: {
        project: {
          include: {
            client: true,
            department: true,
          },
        },
      },
      orderBy: { tentativeBillingDate: "asc" },
    });

    return NextResponse.json(bills);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
