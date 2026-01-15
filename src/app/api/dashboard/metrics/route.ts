import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { handlePrismaError } from "@/lib/api-error";

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
      const parsed = parseInt(departmentId);
      if (!isNaN(parsed)) where.departmentId = parsed;
    }
    if (clientId && clientId !== "all") {
      const parsed = parseInt(clientId);
      if (!isNaN(parsed)) where.clientId = parsed;
    }
    if (projectId && projectId !== "all") {
      const parsed = parseInt(projectId);
      if (!isNaN(parsed)) where.id = parsed;
    }

    const projects = await prisma.project.findMany({
      where,
      include: { bills: true },
    });

    const totalBudget = projects.reduce(
      (sum, p) => sum + Number(p.totalProjectValue || 0),
      0
    );
    const totalReceived = projects
      .flatMap((p) => p.bills)
      .reduce((sum, b) => sum + Number(b.receivedAmount || 0), 0);

    return NextResponse.json({
      totalBudget,
      totalReceived,
      totalRemaining: totalBudget - totalReceived,
      activeCount: projects.length,
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return handlePrismaError(error);
  }
}
