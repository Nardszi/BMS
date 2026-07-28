import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyUsersByRole } from "@/lib/notify";
import { permitSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

function generatePermitNumber(): string {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `BP-${year}-${code}`;
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const expiringSoon = searchParams.get("expiringSoon") === "true";
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (status) where.status = status;
    if (expiringSoon) {
      where.status = "ACTIVE";
      where.expiryDate = { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) };
    }
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: "insensitive" } },
        { permitNumber: { contains: search, mode: "insensitive" } },
        { owner: { firstName: { contains: search, mode: "insensitive" } } },
        { owner: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const permits = await prisma.businessPermit.findMany({
      where,
      include: { owner: true },
      orderBy: { createdAt: "desc" },
      take: 10000,
    });

    const now = new Date();
    const toUpdate = permits.filter((p) => p.status === "ACTIVE" && new Date(p.expiryDate) < now);
    if (toUpdate.length > 0) {
      await prisma.businessPermit.updateMany({
        where: { id: { in: toUpdate.map((p) => p.id) } },
        data: { status: "EXPIRED" },
      });
      toUpdate.forEach((p) => (p.status = "EXPIRED"));
    }

    return NextResponse.json(permits);
  } catch (error) {
    console.error("GET /api/permits error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole([Role.ADMIN, Role.TREASURER]);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const parsed = permitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { businessName, ownerResidentId, businessType, address, issueDate, expiryDate } = parsed.data;

    const ownerExists = await prisma.resident.findUnique({ where: { id: ownerResidentId } });
    if (!ownerExists) {
      return NextResponse.json({ error: "Owner resident not found" }, { status: 404 });
    }

    let permitNumber: string;
    let attempts = 0;
    do {
      permitNumber = generatePermitNumber();
      attempts++;
    } while (await prisma.businessPermit.findUnique({ where: { permitNumber } }) && attempts < 10);

    const permit = await prisma.businessPermit.create({
      data: {
        businessName, ownerResidentId, businessType, address,
        permitNumber, issueDate: new Date(issueDate), expiryDate: new Date(expiryDate),
      },
      include: { owner: true },
    });

    await notifyUsersByRole("TREASURER", "New Business Permit", `${businessName} (${permitNumber}) has been registered.`, "permit", "/permits").catch(() => {});

    await logAudit({ userId: user.id, action: "CREATE", entity: "Permit", entityId: permit.id, details: { businessName, permitNumber } }).catch(() => {});

    return NextResponse.json(permit, { status: 201 });
  } catch (error) {
    console.error("POST /api/permits error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
