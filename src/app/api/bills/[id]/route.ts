// src/app/api/bills/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { handlePrismaError, apiError } from "@/lib/api-error";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { id } = await params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return apiError("Invalid bill ID", "BAD_REQUEST");
    }

    const body = await request.json();

    const {
      receivedAmount,
      receivedDate,
      receivedPercent,
      remainingAmount,
      vat,
      it,
      status,
    } = body;

    // Validate the bill exists
    const existingBill = await prisma.projectBill.findUnique({
      where: { id: parsedId },
    });

    if (!existingBill) {
      return apiError("Bill not found", "NOT_FOUND");
    }

    // Validate received amount doesn't exceed bill amount
    const billAmount = Number(existingBill.billAmount);
    const newReceivedAmount = Number(receivedAmount);

    if (isNaN(newReceivedAmount)) {
      return apiError("Invalid received amount", "VALIDATION_ERROR");
    }

    if (newReceivedAmount > billAmount) {
      return apiError("Received amount cannot exceed bill amount", "VALIDATION_ERROR");
    }

    if (newReceivedAmount < 0) {
      return apiError("Received amount cannot be negative", "VALIDATION_ERROR");
    }

    // Update the bill - Prisma handles Decimal conversion automatically
    const updatedBill = await prisma.projectBill.update({
      where: { id: parsedId },
      data: {
        receivedAmount: receivedAmount,
        receivedDate: receivedDate ? new Date(receivedDate) : null,
        receivedPercent: receivedPercent || null,
        remainingAmount: remainingAmount || null,
        vat: vat || null,
        it: it || null,
        status: status || existingBill.status,
      },
    });

    return NextResponse.json(updatedBill, { status: 200 });
  } catch (error) {
    console.error("Bill update error:", error);
    return handlePrismaError(error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { id } = await params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return apiError("Invalid bill ID", "BAD_REQUEST");
    }

    const bill = await prisma.projectBill.findUnique({
      where: { id: parsedId },
      include: {
        project: {
          include: {
            client: true,
            department: true,
            category: true,
          },
        },
      },
    });

    if (!bill) {
      return apiError("Bill not found", "NOT_FOUND");
    }

    return NextResponse.json(bill);
  } catch (error) {
    console.error("Bill fetch error:", error);
    return handlePrismaError(error);
  }
}
