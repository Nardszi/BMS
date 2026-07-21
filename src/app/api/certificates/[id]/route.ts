import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUsersByRole } from "@/lib/notify";
import { logAudit } from "@/lib/audit";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    if (!["ADMIN", "SECRETARY"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
        issuedById: status === "APPROVED" ? session.user.id : undefined,
      },
      include: { resident: true },
    });

    if (status === "APPROVED") {
      notifyUsersByRole("SECRETARY", "Certificate Approved", `${certificate.type} request for ${certificate.resident.firstName} ${certificate.resident.lastName} has been approved.`, "certificate", "/certificates");
    } else if (status === "DENIED") {
      notifyUsersByRole("SECRETARY", "Certificate Denied", `${certificate.type} request for ${certificate.resident.firstName} ${certificate.resident.lastName} has been denied.`, "certificate", "/certificates");
    }

    logAudit({ userId: session.user.id, action: `STATUS_${status}`, entity: "Certificate", entityId: params.id, details: { type: certificate.type, residentName: `${certificate.resident.firstName} ${certificate.resident.lastName}` } });

    return NextResponse.json(certificate);
  } catch (error) {
    console.error("PUT /api/certificates/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    if (!["ADMIN", "SECRETARY"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.certificateRequest.delete({ where: { id: params.id } });

    logAudit({ userId: session.user.id, action: "DELETE", entity: "Certificate", entityId: params.id });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("DELETE /api/certificates/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
