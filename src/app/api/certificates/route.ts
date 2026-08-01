import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyUsersByRole } from "@/lib/notify";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const authUser = await requireAuth();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const certificates = await prisma.certificateRequest.findMany({
      where,
      include: {
        resident: { include: { household: true } },
        issuedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10000,
    });

    return NextResponse.json(certificates);
  } catch (error) {
    console.error("GET /api/certificates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { residentId, type, purpose } = body;

    if (!residentId || !type || !purpose) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!["CLEARANCE", "RESIDENCY", "INDIGENCY", "BUSINESS_PERMIT"].includes(type)) {
      return NextResponse.json({ error: "Invalid certificate type" }, { status: 400 });
    }

    const residentExists = await prisma.resident.findUnique({ where: { id: residentId } });
    if (!residentExists) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    const year = new Date().getFullYear();
    const certificate = await prisma.$transaction(async (tx) => {
      const latest = await tx.certificateRequest.findFirst({
        where: { referenceNumber: { startsWith: `IX-${year}-` } },
        orderBy: { referenceNumber: "desc" },
      });
      const nextNum = latest ? parseInt(latest.referenceNumber!.split("-")[2]) + 1 : 1;
      const referenceNumber = `IX-${year}-${String(nextNum).padStart(3, "0")}`;

      return tx.certificateRequest.create({
        data: {
          residentId,
          type,
          purpose,
          referenceNumber,
          status: "PENDING",
        },
        include: { resident: true },
      });
    });

    await notifyUsersByRole("SECRETARY", "New Certificate Request", `A new ${type} request has been submitted for ${residentExists.firstName} ${residentExists.lastName}.`, "certificate", "/certificates").catch(() => {});

    await logAudit({ userId: user.id, action: "CREATE", entity: "Certificate", entityId: certificate.id, details: { type, residentName: `${residentExists.firstName} ${residentExists.lastName}`, referenceNumber: certificate.referenceNumber } }).catch(() => {});

    return NextResponse.json(certificate, { status: 201 });
  } catch (error) {
    console.error("POST /api/certificates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireRole([Role.ADMIN, Role.SECRETARY]);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { ids } = body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No certificate IDs provided" }, { status: 400 });
    }

    await prisma.certificateRequest.deleteMany({ where: { id: { in: ids } } });

    await logAudit({ userId: user.id, action: "DELETE", entity: "Certificate", entityId: ids.join(","), details: { count: ids.length } }).catch(() => {});

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error("DELETE /api/certificates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
