import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

const VALID_STATUSES = ["ACTIVE", "EXPIRED", "REVOKED"] as const;

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole([Role.ADMIN, Role.SECRETARY]);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const id = await prisma.barangayID.update({
      where: { id: params.id },
      data: { status: body.status, photoUrl: body.photoUrl },
      include: { resident: { include: { household: true } }, issuedBy: { select: { id: true, name: true, role: true } } },
    });

    await logAudit({ userId: user.id, action: "UPDATE", entity: "BarangayId", entityId: params.id, details: { idNumber: id.idNumber, newStatus: body.status } }).catch(() => {});

    return NextResponse.json(id);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole([Role.ADMIN]);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.barangayID.delete({ where: { id: params.id } });

    await logAudit({ userId: user.id, action: "DELETE", entity: "BarangayId", entityId: params.id }).catch(() => {});

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
