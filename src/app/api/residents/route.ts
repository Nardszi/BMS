import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const purok = searchParams.get("purok") || "";
  const status = searchParams.get("status") || "";
  const sortBy = searchParams.get("sortBy") || "lastName";
  const sortOrder = searchParams.get("sortOrder") || "asc";

  const where: any = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { middleName: { contains: search, mode: "insensitive" } },
      { contactNumber: { contains: search, mode: "insensitive" } },
    ];
  }
  if (purok) {
    where.household = { purok };
  }
  if (status) {
    where.status = status;
  }

  const order: any = {};
  if (sortBy === "purok") {
    order.household = { purok: sortOrder };
  } else if (sortBy === "name") {
    order.lastName = sortOrder;
  } else if (sortBy === "status") {
    order.status = sortOrder;
  } else if (sortBy === "date") {
    order.createdAt = sortOrder;
  } else {
    order[sortBy] = sortOrder;
  }

  const [residents, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
    prisma.resident.findMany({
      where,
      include: { household: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: order,
    }),
    prisma.resident.count({ where }),
    prisma.resident.count({ where: { status: "PENDING" } }),
    prisma.resident.count({ where: { status: "APPROVED" } }),
    prisma.resident.count({ where: { status: "REJECTED" } }),
  ]);

  return NextResponse.json({ residents, total, totalPages: Math.ceil(total / limit), pendingCount, approvedCount, rejectedCount });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const resident = await prisma.resident.create({
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName,
      birthDate: new Date(body.birthDate),
      gender: body.gender,
      civilStatus: body.civilStatus,
      householdId: body.householdId,
      occupation: body.occupation,
      contactNumber: body.contactNumber,
      isRegisteredVoter: body.isRegisteredVoter || false,
    },
  });

  return NextResponse.json(resident, { status: 201 });
}
