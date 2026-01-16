import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const year = parseInt(
    searchParams.get("year") || new Date().getFullYear().toString()
  );
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
      receivedDate: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      },
      status: "PAID",
      project: projectWhere,
    },
    include: {
      project: true,
    },
  });

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const data = months.map((month, index) => {
    const amount = bills
      .filter(
        (b) => b.receivedDate && new Date(b.receivedDate).getMonth() === index
      )
      .reduce((sum, b) => sum + Number(b.receivedAmount || 0), 0);
    return { month, received: amount };
  });

  return NextResponse.json(data);
}
