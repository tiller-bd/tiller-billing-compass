import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { id } = await params;
    const body = await request.json();
    const { receivedAmount, receivedDate } = body;

    const currentBill = await prisma.projectBill.findUnique({
      where: { id: parseInt(id) },
    });

    if (!currentBill)
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });

    const totalReceived = parseFloat(receivedAmount);
    const billAmount = Number(currentBill.billAmount);

    // Determine Status
    let status: "PAID" | "PARTIAL" | "PENDING" = "PARTIAL";
    if (totalReceived >= billAmount) status = "PAID";
    if (totalReceived <= 0) status = "PENDING";

    const updatedBill = await prisma.projectBill.update({
      where: { id: parseInt(id) },
      data: {
        receivedAmount: totalReceived,
        receivedDate: receivedDate ? new Date(receivedDate) : null,
        status: status,
      },
    });

    return NextResponse.json(updatedBill);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
