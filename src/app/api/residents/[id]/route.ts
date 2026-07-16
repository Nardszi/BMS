import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resident = await prisma.resident.findUnique({
    where: { id: params.id },
    include: { household: true, certificateRequests: true, businessPermits: true },
  });

  if (!resident) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(resident);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const resident = await prisma.resident.update({
    where: { id: params.id },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName,
      birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
      gender: body.gender,
      civilStatus: body.civilStatus,
      householdId: body.householdId,
      occupation: body.occupation,
      contactNumber: body.contactNumber,
      isRegisteredVoter: body.isRegisteredVoter,
    },
  });

  return NextResponse.json(resident);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "SECRETARY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.resident.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Deleted" });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["ADMIN", "SECRETARY", "KAGAWAD"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const resident = await prisma.resident.update({
    where: { id: params.id },
    data: { status: body.status },
  });

  return NextResponse.json(resident);
}
