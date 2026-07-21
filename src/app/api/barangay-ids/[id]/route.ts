import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

const VALID_STATUSES = ["ACTIVE", "EXPIRED", "REVOKED"] as const;

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    if (!["ADMIN", "SECRETARY"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const id = await prisma.barangayID.update({
      where: { id: params.id },
      data: { status: body.status, photoUrl: body.photoUrl },
      include: { resident: { include: { household: true } }, issuedBy: true },
    });

    logAudit({ userId: session.user.id, action: "UPDATE", entity: "BarangayId", entityId: params.id, details: { idNumber: id.idNumber, newStatus: body.status } });

    return NextResponse.json(id);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.barangayID.delete({ where: { id: params.id } });

    logAudit({ userId: session.user.id, action: "DELETE", entity: "BarangayId", entityId: params.id });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
