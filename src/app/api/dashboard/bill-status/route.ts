import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseYearValue, getYearDateRange } from '@/lib/date-utils';

export async function GET(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const yearParam    = searchParams.get('year') ?? 'all';
  const departmentId = searchParams.get('departmentId');
  const clientId     = searchParams.get('clientId');

  const projectWhere: any = {};
  if (departmentId) projectWhere.departmentId = parseInt(departmentId);
  if (clientId)     projectWhere.clientId     = parseInt(clientId);

  const billWhere: any = {};
  if (Object.keys(projectWhere).length > 0) billWhere.project = projectWhere;

  if (yearParam !== 'all') {
    const parsed = parseYearValue(yearParam);
    const range  = getYearDateRange(parsed.year, parsed.type === 'fiscal');
    billWhere.tentativeBillingDate = { gte: range.start, lte: range.end };
  }

  const bills = await prisma.projectBill.findMany({
    where: billWhere,
    select: { status: true, billAmount: true },
  });

  const grouped: Record<string, { count: number; total: number }> = {};
  for (const bill of bills) {
    const s = bill.status ?? 'PENDING';
    if (!grouped[s]) grouped[s] = { count: 0, total: 0 };
    grouped[s].count++;
    grouped[s].total += Number(bill.billAmount ?? 0);
  }

  return NextResponse.json(
    Object.entries(grouped).map(([status, { count, total }]) => ({ status, count, total }))
  );
}
