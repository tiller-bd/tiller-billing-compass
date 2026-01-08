import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(
    searchParams.get("year") || new Date().getFullYear().toString()
  );

  const bills = await prisma.projectBill.findMany({
    where: {
      receivedDate: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      },
      status: "PAID",
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
