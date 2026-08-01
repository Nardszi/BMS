import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyUsersByRole } from "@/lib/notify";
import { blotterSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const authUser = await requireAuth();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      include: { handledBy: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 10000,
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
    const user = await requireRole([Role.ADMIN, Role.SECRETARY, Role.KAGAWAD]);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const parsed = blotterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { complainantName, respondentName, incidentDate, incidentType, location, witnesses, narrative } = parsed.data;

    const year = new Date().getFullYear();
    const blotter = await prisma.$transaction(async (tx) => {
      const latest = await tx.blotterReport.findFirst({
        where: { caseNumber: { startsWith: `BRG-${year}-` } },
        orderBy: { caseNumber: "desc" },
      });
      const nextNum = latest ? parseInt(latest.caseNumber.split("-")[2]) + 1 : 1;
      const caseNumber = `BRG-${year}-${String(nextNum).padStart(4, "0")}`;

      return tx.blotterReport.create({
        data: {
          caseNumber,
          complainantName, respondentName,
          incidentDate: new Date(incidentDate),
          incidentType, location: location || null,
          witnesses: witnesses || null, narrative,
          handledById: user.id,
        },
      });
    });

    await notifyUsersByRole("KAGAWAD", "New Blotter Report", `Case ${blotter.caseNumber}: ${incidentType} reported by ${complainantName} vs ${respondentName}.`, "blotter", "/blotter").catch(() => {});

    await logAudit({ userId: user.id, action: "CREATE", entity: "Blotter", entityId: blotter.id, details: { caseNumber: blotter.caseNumber, incidentType, complainantName, respondentName } }).catch(() => {});

    return NextResponse.json(blotter, { status: 201 });
  } catch (error) {
    console.error("POST /api/blotter error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireRole([Role.ADMIN, Role.SECRETARY, Role.KAGAWAD]);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { ids } = body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No blotter IDs provided" }, { status: 400 });
    }

    await prisma.blotterReport.deleteMany({ where: { id: { in: ids } } });

    await logAudit({ userId: user.id, action: "DELETE", entity: "Blotter", entityId: ids.join(","), details: { count: ids.length } }).catch(() => {});

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error("DELETE /api/blotter error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
