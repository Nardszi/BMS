import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
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
    if (purok) where.household = { purok };
    if (status) where.status = status;

    const order: any = {};
    if (sortBy === "purok") order.household = { purok: sortOrder };
    else if (sortBy === "name") order.lastName = sortOrder;
    else if (sortBy === "status") order.status = sortOrder;
    else if (sortBy === "date") order.createdAt = sortOrder;
    else order[sortBy] = sortOrder;

    const [residents, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.resident.findMany({ where, include: { household: true }, skip: (page - 1) * limit, take: limit, orderBy: order }),
      prisma.resident.count({ where }),
      prisma.resident.count({ where: { status: "PENDING" } }),
      prisma.resident.count({ where: { status: "APPROVED" } }),
      prisma.resident.count({ where: { status: "REJECTED" } }),
    ]);

    return NextResponse.json({ residents, total, totalPages: Math.ceil(total / limit), pendingCount, approvedCount, rejectedCount });
  } catch (error) {
    console.error("GET /api/residents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["ADMIN", "SECRETARY", "STAFF"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { firstName, lastName, birthDate, gender, civilStatus, address, purok, occupation, contactNumber, emergencyContact, emergencyPhone, isRegisteredVoter, middleName } = body;

    if (!firstName || !lastName || !birthDate || !gender || !civilStatus || !address || !purok) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!["MALE", "FEMALE"].includes(gender)) {
      return NextResponse.json({ error: "Invalid gender" }, { status: 400 });
    }
    if (!["SINGLE", "MARRIED", "WIDOWED", "SEPARATED", "DIVORCED"].includes(civilStatus)) {
      return NextResponse.json({ error: "Invalid civil status" }, { status: 400 });
    }

    const household = await prisma.household.create({
      data: { householdNumber: `HH-${Date.now()}`, address, purok },
    });

    const resident = await prisma.resident.create({
      data: {
        firstName, lastName, middleName: middleName || null,
        birthDate: new Date(birthDate), gender, civilStatus,
        householdId: household.id, occupation: occupation || null,
        contactNumber: contactNumber || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
        isRegisteredVoter: isRegisteredVoter || false,
        status: role === "ADMIN" ? "APPROVED" : "PENDING",
      },
    });

    return NextResponse.json(resident, { status: 201 });
  } catch (error) {
    console.error("POST /api/residents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
