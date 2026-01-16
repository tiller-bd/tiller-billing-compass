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
      billName,
      billPercent,
      billAmount,
      tentativeBillingDate,
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

    // Build update data object - only include provided fields
    const updateData: any = {};

    // Handle bill details fields
    if (billName !== undefined) {
      updateData.billName = billName;
    }

    if (billPercent !== undefined) {
      updateData.billPercent = billPercent;
    }

    if (billAmount !== undefined) {
      const amount = Number(billAmount);
      if (isNaN(amount) || amount < 0) {
        return apiError("Invalid bill amount", "VALIDATION_ERROR");
      }
      updateData.billAmount = amount;
    }

    if (tentativeBillingDate !== undefined) {
      updateData.tentativeBillingDate = tentativeBillingDate ? new Date(tentativeBillingDate) : null;
    }

    // Only validate receivedAmount if it's provided
    if (receivedAmount !== undefined && receivedAmount !== null) {
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

      updateData.receivedAmount = receivedAmount;
    }

    if (receivedDate !== undefined) {
      updateData.receivedDate = receivedDate ? new Date(receivedDate) : null;
    }
    if (receivedPercent !== undefined) {
      updateData.receivedPercent = receivedPercent || null;
    }
    if (remainingAmount !== undefined) {
      updateData.remainingAmount = remainingAmount || null;
    }
    if (vat !== undefined) {
      updateData.vat = vat || null;
    }
    if (it !== undefined) {
      updateData.it = it || null;
    }
    if (status !== undefined) {
      updateData.status = status;
    }

    // Update the bill - Prisma handles Decimal conversion automatically
    const updatedBill = await prisma.projectBill.update({
      where: { id: parsedId },
      data: updateData,
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

export async function DELETE(
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

    // Verify the bill exists
    const existingBill = await prisma.projectBill.findUnique({
      where: { id: parsedId },
    });

    if (!existingBill) {
      return apiError("Bill not found", "NOT_FOUND");
    }

    await prisma.projectBill.delete({
      where: { id: parsedId },
    });

    return NextResponse.json({ success: true, message: "Bill deleted successfully" });
  } catch (error) {
    console.error("Bill delete error:", error);
    return handlePrismaError(error);
  }
}
