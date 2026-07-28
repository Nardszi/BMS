import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { barangayIdSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { idNumber: { contains: search, mode: "insensitive" } },
        { resident: { firstName: { contains: search, mode: "insensitive" } } },
        { resident: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const ids = await prisma.barangayID.findMany({
      where,
      include: { resident: { include: { household: true } }, issuedBy: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 10000,
    });

    return NextResponse.json(ids);
  } catch (error) {
    console.error("GET /api/barangay-ids error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole([Role.ADMIN, Role.SECRETARY]);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const parsed = barangayIdSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { residentId, photoUrl, contactNumber, address } = parsed.data;

    const existing = await prisma.barangayID.findFirst({
      where: { residentId, status: "ACTIVE" },
    });
    if (existing) {
      return NextResponse.json({ error: "Resident already has an active Barangay ID" }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const barangayId = await prisma.$transaction(async (tx) => {
      const latest = await tx.barangayID.findFirst({
        where: { idNumber: { startsWith: `BRGY-${year}-` } },
        orderBy: { idNumber: "desc" },
      });
      const nextNum = latest ? parseInt(latest.idNumber.split("-")[2]) + 1 : 1;
      const idNumber = `BRGY-${year}-${String(nextNum).padStart(5, "0")}`;

      const issueDate = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 3);

      return tx.barangayID.create({
        data: {
          residentId, idNumber, photoUrl: photoUrl || null,
          issueDate, expiryDate, contactNumber: contactNumber || null,
          address, issuedById: user.id,
        },
        include: { resident: { include: { household: true } }, issuedBy: { select: { id: true, name: true, role: true } } },
      });
    });

    await logAudit({ userId: user.id, action: "CREATE", entity: "BarangayId", entityId: barangayId.id, details: { idNumber: barangayId.idNumber } }).catch(() => {});

    return NextResponse.json(barangayId, { status: 201 });
  } catch (error) {
    console.error("POST /api/barangay-ids error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
