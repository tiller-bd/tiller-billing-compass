import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

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

    if (departmentId && departmentId !== "all")
      where.departmentId = parseInt(departmentId);
    if (categoryId && categoryId !== "all")
      where.categoryId = parseInt(categoryId);
    if (clientId && clientId !== "all")
      where.clientId = parseInt(clientId);
    if (projectId && projectId !== "all")
      where.id = parseInt(projectId);

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
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
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

    const result = await prisma.$transaction(async (tx) => {
      let finalClientId = clientId;
      if (!clientId && newClient) {
        const client = await tx.client.create({ data: newClient });
        finalClientId = client.id;
      }

      return await tx.project.create({
        data: {
          projectName,
          clientId: parseInt(finalClientId),
          departmentId: parseInt(departmentId),
          categoryId: parseInt(categoryId),
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          totalProjectValue: parseFloat(totalProjectValue),
          bills: {
            create: bills.map((bill: any) => ({
              billName: bill.billName,
              billPercent: parseFloat(bill.billPercent),
              billAmount: parseFloat(bill.billAmount),
              // Ensure this date is captured
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
