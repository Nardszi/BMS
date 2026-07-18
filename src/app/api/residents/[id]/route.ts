import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resident = await prisma.resident.findUnique({
      where: { id: params.id },
      include: { household: true, certificateRequests: true, businessPermits: true },
    });
    if (!resident) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(resident);
  } catch (error) {
    console.error("GET /api/residents/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["ADMIN", "SECRETARY", "STAFF"].includes(role)) {
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

    return NextResponse.json(resident);
  } catch (error) {
    console.error("PUT /api/residents/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "ADMIN" && role !== "SECRETARY") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.resident.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("DELETE /api/residents/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["ADMIN", "SECRETARY", "KAGAWAD"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    if (!body.status || !["PENDING", "APPROVED", "REJECTED"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const resident = await prisma.resident.update({
      where: { id: params.id },
      data: { status: body.status },
    });

    return NextResponse.json(resident);
  } catch (error) {
    console.error("PATCH /api/residents/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
