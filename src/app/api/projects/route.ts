import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { handlePrismaError, apiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId");
    const categoryId = searchParams.get("categoryId");
    const year = searchParams.get("year");
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const projectId = searchParams.get("projectId");

    const where: any = {
      OR: [
        { projectName: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } },
      ],
    };

    if (departmentId && departmentId !== "all") {
      const parsed = parseInt(departmentId);
      if (!isNaN(parsed)) where.departmentId = parsed;
    }
    if (categoryId && categoryId !== "all") {
      const parsed = parseInt(categoryId);
      if (!isNaN(parsed)) where.categoryId = parsed;
    }
    if (clientId && clientId !== "all") {
      const parsed = parseInt(clientId);
      if (!isNaN(parsed)) where.clientId = parsed;
    }
    if (projectId && projectId !== "all") {
      const parsed = parseInt(projectId);
      if (!isNaN(parsed)) where.id = parsed;
    }

    if (year && year !== "all") {
      where.startDate = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: true,
        department: true,
        category: true,
        bills: true,
      },
      orderBy: { startDate: "desc" },
    });

    // Client-side filtering for complex status logic if needed
    let filtered = projects;
    if (status && status !== "all") {
      filtered = projects.filter((p) => {
        const isPaid =
          p.bills.length > 0 && p.bills.every((b) => b.status === "PAID");
        if (status === "COMPLETED") return isPaid;
        if (status === "ONGOING") return !isPaid && p.bills.length > 0;
        return true;
      });
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Projects fetch error:", error);
    return handlePrismaError(error);
  }
}

export async function POST(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const {
      projectName,
      clientId,
      newClient,
      departmentId,
      categoryId,
      startDate,
      endDate,
      totalProjectValue,
      bills,
    } = body;

    if (!projectName || !projectName.trim()) {
      return apiError("Project name is required", "VALIDATION_ERROR");
    }

    if (!departmentId) {
      return apiError("Department is required", "VALIDATION_ERROR");
    }

    if (!categoryId) {
      return apiError("Category is required", "VALIDATION_ERROR");
    }

    const result = await prisma.$transaction(async (tx) => {
      let finalClientId = clientId;
      if (!clientId && newClient) {
        const client = await tx.client.create({ data: newClient });
        finalClientId = client.id;
      }

      return await tx.project.create({
        data: {
          projectName: projectName.trim(),
          clientId: parseInt(finalClientId),
          departmentId: parseInt(departmentId),
          categoryId: parseInt(categoryId),
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          totalProjectValue: parseFloat(totalProjectValue) || 0,
          bills: {
            create: (bills || []).map((bill: any) => ({
              billName: bill.billName,
              billPercent: parseFloat(bill.billPercent) || 0,
              billAmount: parseFloat(bill.billAmount) || 0,
              tentativeBillingDate: bill.tentativeBillingDate
                ? new Date(bill.tentativeBillingDate)
                : null,
              status: "PENDING",
            })),
          },
        },
      });
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Project create error:", error);
    return handlePrismaError(error);
  }
}
