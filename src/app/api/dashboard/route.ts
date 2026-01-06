import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        bills: true,
        client: true,
        category: true,
      }
    });

    const toNum = (val: any) => (val ? Number(val) : 0);

    // 1. Calculate Metrics
    const totalBudget = projects.reduce((sum, p) => sum + toNum(p.totalProjectValue), 0);
    const allBills = projects.flatMap(p => p.bills);
    const totalReceived = allBills.reduce((sum, b) => sum + toNum(b.receivedAmount), 0);
    const totalRemaining = totalBudget - totalReceived;

    const lastReceivedBill = [...allBills]
      .filter(b => b.receivedDate && b.receivedAmount > 0)
      .sort((a, b) => new Date(b.receivedDate!).getTime() - new Date(a.receivedDate!).getTime())[0];

    const lastReceived = lastReceivedBill ? {
      projectName: projects.find(p => p.id === lastReceivedBill.projectId)?.projectName || '',
      amount: toNum(lastReceivedBill.receivedAmount),
      date: lastReceivedBill.receivedDate
    } : null;

    const upcomingDeadlines = allBills
      .filter(b => b.status !== 'PAID' && b.tentativeBillingDate && new Date(b.tentativeBillingDate) > new Date())
      .sort((a, b) => new Date(a.tentativeBillingDate!).getTime() - new Date(b.tentativeBillingDate!).getTime())
      .slice(0, 5)
      .map(b => ({
        projectName: projects.find(p => p.id === b.projectId)?.projectName || '',
        amount: toNum(b.billAmount),
        dueDate: b.tentativeBillingDate
      }));

    // 2. Monthly Revenue (Current Year)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = months.map((month, index) => {
      const received = allBills
        .filter(b => b.receivedDate && new Date(b.receivedDate).getMonth() === index && new Date(b.receivedDate).getFullYear() === currentYear)
        .reduce((sum, b) => sum + toNum(b.receivedAmount), 0);
      return { month, received: received / 1000000 };
    });

    // 3. Project Distribution
    const categoryCounts: Record<string, number> = {};
    projects.forEach(p => {
      const cat = p.category.name;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const distribution = Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value,
      color: name.includes('Software') ? 'hsl(173, 80%, 36%)' : 'hsl(190, 70%, 40%)'
    }));

    // 4. Budget Comparison
    const budgetComparison = projects.map(p => {
      const received = p.bills.reduce((sum, b) => sum + toNum(b.receivedAmount), 0);
      return {
        name: p.projectName.length > 15 ? p.projectName.substring(0, 15) + '...' : p.projectName,
        received: received / 1000000,
        remaining: (toNum(p.totalProjectValue) - received) / 1000000
      };
    });

    return NextResponse.json({
      metrics: { totalBudget, totalReceived, totalRemaining, lastReceived, upcomingDeadlines },
      monthlyRevenue,
      distribution,
      budgetComparison,
      projects // Raw projects for the table component
    });

  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}