import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    if (!["ADMIN", "SECRETARY", "TREASURER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resident = await prisma.resident.findUnique({
      where: { id: params.id },
      include: { household: true, certificateRequests: true, businessPermits: true },
    });
    if (!resident) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(resident);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    if (!["ADMIN", "SECRETARY"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const existing = await prisma.resident.findUnique({ where: { id: params.id }, include: { household: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { address, purok, ...residentData } = body;

    if ((address || purok) && existing.householdId) {
      await prisma.household.update({
        where: { id: existing.householdId },
        data: { ...(address && { address }), ...(purok && { purok }) },
      });
    }

    const resident = await prisma.resident.update({
      where: { id: params.id },
      data: {
        firstName: residentData.firstName,
        lastName: residentData.lastName,
        middleName: residentData.middleName || null,
        birthDate: residentData.birthDate ? new Date(residentData.birthDate) : undefined,
        gender: residentData.gender,
        civilStatus: residentData.civilStatus,
        occupation: residentData.occupation || null,
        contactNumber: residentData.contactNumber || null,
        emergencyContact: residentData.emergencyContact || null,
        emergencyPhone: residentData.emergencyPhone || null,
        isRegisteredVoter: residentData.isRegisteredVoter,
      },
    });

    logAudit({ userId: session.user.id, action: "UPDATE", entity: "Resident", entityId: params.id, details: { name: `${resident.firstName} ${resident.lastName}` } });

    return NextResponse.json(resident);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    if (role !== "ADMIN" && role !== "SECRETARY") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.resident.delete({ where: { id: params.id } });

    logAudit({ userId: session.user.id, action: "DELETE", entity: "Resident", entityId: params.id });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    if (!["ADMIN", "SECRETARY"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const resident = await prisma.resident.update({
      where: { id: params.id },
      data: { status: body.status },
    });

    logAudit({ userId: session.user.id, action: "STATUS_CHANGE", entity: "Resident", entityId: params.id, details: { newStatus: body.status } });

    return NextResponse.json(resident);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
