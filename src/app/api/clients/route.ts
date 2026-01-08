import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const clients = await prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { contactPerson: { contains: search, mode: "insensitive" } },
        ],
      },
      include: {
        projects: {
          include: {
            bills: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Transform data to include financial aggregates
    const transformed = clients.map((client) => {
      const totalBudget = client.projects.reduce(
        (sum, p) => sum + Number(p.totalProjectValue),
        0
      );
      const totalReceived = client.projects
        .flatMap((p) => p.bills)
        .reduce((sum, b) => sum + Number(b.receivedAmount || 0), 0);

      return {
        ...client,
        projectCount: client.projects.length,
        totalBudget,
        totalReceived,
        totalDue: totalBudget - totalReceived,
        realizationRate:
          totalBudget > 0 ? (totalReceived / totalBudget) * 100 : 0,
      };
    });

    return NextResponse.json(transformed);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;
  try {
    const body = await request.json();
    const { name, contactPerson, contactEmail, contactPhone } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        name,
        contactPerson,
        contactEmail,
        contactPhone,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A client with this name already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
