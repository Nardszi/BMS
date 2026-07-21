import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    if (!["ADMIN", "SECRETARY", "KAGAWAD"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    if (body.status && !["OPEN", "RESOLVED", "ESCALATED"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const blotter = await prisma.blotterReport.update({
      where: { id: params.id },
      data: {
        status: body.status,
        resolutionNotes: body.resolutionNotes || undefined,
      },
    });

    logAudit({ userId: session.user.id, action: "UPDATE", entity: "Blotter", entityId: params.id, details: { caseNumber: blotter.caseNumber, newStatus: body.status } });

    return NextResponse.json(blotter);
  } catch (error) {
    console.error("PUT /api/blotter/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    if (!["ADMIN", "SECRETARY", "KAGAWAD"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.blotterReport.delete({ where: { id: params.id } });

    logAudit({ userId: session.user.id, action: "DELETE", entity: "Blotter", entityId: params.id });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("DELETE /api/blotter/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
