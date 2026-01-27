import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { handlePrismaError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(request.url);
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

    // Get all PAID and PARTIAL bills with receivedDate
    const bills = await prisma.projectBill.findMany({
      where: {
        receivedDate: { not: null },
        status: { in: ["PAID", "PARTIAL"] },
        project: projectWhere,
      },
      select: {
        receivedDate: true,
        receivedAmount: true,
      },
    });

    // Aggregate by year
    const yearlyMap = new Map<number, number>();

    bills.forEach((bill) => {
      if (!bill.receivedDate) return;
      const year = new Date(bill.receivedDate).getFullYear();
      const current = yearlyMap.get(year) || 0;
      yearlyMap.set(year, current + Number(bill.receivedAmount || 0));
    });

    // Convert to sorted array
    const data = Array.from(yearlyMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, received]) => ({
        year: year.toString(),
        received,
      }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Yearly Revenue API Error:", error);
    return handlePrismaError(error);
  }
}
