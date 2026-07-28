import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyUsersByRole } from "@/lib/notify";
import { logAudit } from "@/lib/audit";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole([Role.ADMIN, Role.SECRETARY]);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { status } = body;

    if (!status || !["PENDING", "APPROVED", "RELEASED", "DENIED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const certificate = await prisma.certificateRequest.update({
      where: { id: params.id },
      data: {
        status,
        releaseDate: status === "RELEASED" ? new Date() : undefined,
        issuedById: status === "APPROVED" ? user.id : undefined,
      },
      include: { resident: true },
    });

    if (status === "APPROVED") {
      await notifyUsersByRole("SECRETARY", "Certificate Approved", `${certificate.type} request for ${certificate.resident.firstName} ${certificate.resident.lastName} has been approved.`, "certificate", "/certificates").catch(() => {});
    } else if (status === "DENIED") {
      await notifyUsersByRole("SECRETARY", "Certificate Denied", `${certificate.type} request for ${certificate.resident.firstName} ${certificate.resident.lastName} has been denied.`, "certificate", "/certificates").catch(() => {});
    }

    await logAudit({ userId: user.id, action: `STATUS_${status}`, entity: "Certificate", entityId: params.id, details: { type: certificate.type, residentName: `${certificate.resident.firstName} ${certificate.resident.lastName}` } }).catch(() => {});

    return NextResponse.json(certificate);
  } catch (error) {
    console.error("PUT /api/certificates/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole([Role.ADMIN, Role.SECRETARY]);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.certificateRequest.delete({ where: { id: params.id } });

    await logAudit({ userId: user.id, action: "DELETE", entity: "Certificate", entityId: params.id }).catch(() => {});

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("DELETE /api/certificates/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
