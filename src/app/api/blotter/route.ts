import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";

  const where: any = {};
  if (status) where.status = status;

  const blotters = await prisma.blotterReport.findMany({
    where,
    include: { handledBy: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(blotters);
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
      narrative: body.narrative,
      handledById: (session.user as any).id,
    },
  });

  return NextResponse.json(blotter, { status: 201 });
}
