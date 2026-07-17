import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
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
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["ADMIN", "SECRETARY", "KAGAWAD"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const count = await prisma.blotterReport.count();
  const caseNumber = `BRG-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const blotter = await prisma.blotterReport.create({
    data: {
      caseNumber,
      complainantName: body.complainantName,
      respondentName: body.respondentName,
      incidentDate: new Date(body.incidentDate),
      incidentType: body.incidentType,
      location: body.location || null,
      witnesses: body.witnesses || null,
      narrative: body.narrative,
      handledById: (session.user as any).id,
    },
  });

  return NextResponse.json(blotter, { status: 201 });
}
