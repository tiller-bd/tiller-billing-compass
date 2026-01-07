// import { prisma } from "@/lib/prisma";
// import { NextResponse } from "next/server";

// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const search = searchParams.get("search") || "";

//     const clients = await prisma.client.findMany({
//       where: {
//         OR: [
//           { name: { contains: search, mode: "insensitive" } },
//           { contactPerson: { contains: search, mode: "insensitive" } },
//         ],
//       },
//       include: {
//         projects: {
//           include: {
//             bills: true,
//           },
//         },
//       },
//       orderBy: { name: "asc" },
//     });

//     // Transform data to include financial aggregates
//     const transformed = clients.map((client) => {
//       const totalBudget = client.projects.reduce(
//         (sum, p) => sum + Number(p.totalProjectValue),
//         0
//       );
//       const totalReceived = client.projects
//         .flatMap((p) => p.bills)
//         .reduce((sum, b) => sum + Number(b.receivedAmount || 0), 0);

//       return {
//         ...client,
//         projectCount: client.projects.length,
//         totalBudget,
//         totalReceived,
//         totalDue: totalBudget - totalReceived,
//         realizationRate:
//           totalBudget > 0 ? (totalReceived / totalBudget) * 100 : 0,
//       };
//     });

//     return NextResponse.json(transformed);
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Failed to fetch clients" },
//       { status: 500 }
//     );
//   }
// }
