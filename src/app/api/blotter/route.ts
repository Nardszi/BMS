import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { caseNumber: { contains: search, mode: "insensitive" } },
        { complainantName: { contains: search, mode: "insensitive" } },
        { respondentName: { contains: search, mode: "insensitive" } },
        { incidentType: { contains: search, mode: "insensitive" } },
      ];
    }

    const blotters = await prisma.blotterReport.findMany({
      where,
      include: { handledBy: true },
      orderBy: { createdAt: "desc" },
    });

    const [totalCount, openCount, resolvedCount, escalatedCount] = await Promise.all([
      prisma.blotterReport.count(),
      prisma.blotterReport.count({ where: { status: "OPEN" } }),
      prisma.blotterReport.count({ where: { status: "RESOLVED" } }),
      prisma.blotterReport.count({ where: { status: "ESCALATED" } }),
    ]);

    return NextResponse.json({ blotters, totalCount, openCount, resolvedCount, escalatedCount });
  } catch (error) {
    console.error("GET /api/blotter error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["ADMIN", "SECRETARY", "KAGAWAD"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { complainantName, respondentName, incidentDate, incidentType, location, witnesses, narrative } = body;

    if (!complainantName || !respondentName || !incidentDate || !incidentType || !narrative) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const caseNumber = await prisma.$transaction(async (tx) => {
      const latest = await tx.blotterReport.findFirst({
        where: { caseNumber: { startsWith: `BRG-${year}-` } },
        orderBy: { caseNumber: "desc" },
      });
      const nextNum = latest ? parseInt(latest.caseNumber.split("-")[2]) + 1 : 1;
      return `BRG-${year}-${String(nextNum).padStart(4, "0")}`;
    });

    const blotter = await prisma.blotterReport.create({
      data: {
        caseNumber,
        complainantName, respondentName,
        incidentDate: new Date(incidentDate),
        incidentType, location: location || null,
        witnesses: witnesses || null, narrative,
        handledById: (session.user as any).id,
      },
    });

    return NextResponse.json(blotter, { status: 201 });
  } catch (error) {
    console.error("POST /api/blotter error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
