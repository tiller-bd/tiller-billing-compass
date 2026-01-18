import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { handlePrismaError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = request.nextUrl;
    const departmentId = searchParams.get("departmentId");
    const clientId = searchParams.get("clientId");
    const projectId = searchParams.get("projectId");

    const where: any = {};

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
      include: {
        bills: true,
      },
    });

    const events: any[] = [];

    projects.forEach((project) => {
      // Add project signed date (start date)
      if (project.startDate) {
        events.push({
          date: project.startDate,
          type: 'project_signed',
          title: 'Project Signed',
          projectName: project.projectName,
        });
      }

      // Add PG cleared date
      if (project.pgClearanceDate && project.pgStatus === 'CLEARED') {
        events.push({
          date: project.pgClearanceDate,
          type: 'pg_cleared',
          title: 'PG Cleared',
          projectName: project.projectName,
          amount: Number(project.pgUserDeposit || 0),
        });
      }

      // Add bill events
      project.bills.forEach((bill) => {
        // Tentative payment dates
        if (bill.tentativeBillingDate && bill.status !== 'PAID') {
          events.push({
            date: bill.tentativeBillingDate,
            type: 'tentative_payment',
            title: bill.billName || 'Payment Due',
            projectName: project.projectName,
            amount: Number(bill.billAmount),
          });
        }

        // Received payment dates
        if (bill.receivedDate && bill.receivedAmount && Number(bill.receivedAmount) > 0) {
          events.push({
            date: bill.receivedDate,
            type: 'received_payment',
            title: bill.billName || 'Payment Received',
            projectName: project.projectName,
            amount: Number(bill.receivedAmount),
          });
        }
      });
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Calendar fetch error:", error);
    return handlePrismaError(error);
  }
}
