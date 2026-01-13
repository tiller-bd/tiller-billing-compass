import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get("query") || "";

    if (!query) {
      return NextResponse.json([]);
    }

    const searchCondition = {
      contains: query,
      mode: "insensitive",
    } as const;

    // Search for matching departments
    const departments = await prisma.department.findMany({
      where: {
        name: searchCondition,
      },
      select: {
        id: true,
        name: true,
      },
      take: 5,
    });

    // Search for matching clients
    const clients = await prisma.client.findMany({
      where: {
        name: searchCondition,
      },
      select: {
        id: true,
        name: true,
      },
      take: 5,
    });

    // Search for matching projects
    const projects = await prisma.project.findMany({
      where: {
        projectName: searchCondition,
      },
      select: {
        id: true,
        projectName: true,
      },
      take: 5,
    });

    const suggestions = [
      ...departments.map((d) => ({
        id: d.id.toString(),
        name: d.name,
        type: "department",
      })),
      ...clients.map((c) => ({
        id: c.id.toString(),
        name: c.name,
        type: "client",
      })),
      ...projects.map((p) => ({
        id: p.id.toString(),
        name: p.projectName,
        type: "project",
      })),
    ];

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Search suggestions API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
