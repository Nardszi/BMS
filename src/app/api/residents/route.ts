import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { residentSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(10000, Math.max(1, parseInt(searchParams.get("limit") || "10")));
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

    const role = session.user.role;
    if (!["ADMIN", "SECRETARY", "STAFF"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = residentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { firstName, lastName, birthDate, gender, civilStatus, address, purok, occupation, contactNumber, emergencyContact, emergencyPhone, isRegisteredVoter, middleName } = parsed.data;

    let household = await prisma.household.findFirst({
      where: { address, purok },
    });

    if (!household) {
      household = await prisma.household.create({
        data: { householdNumber: `HH-${Date.now().toString(36).toUpperCase()}`, address, purok },
      });
    }

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

    logAudit({ userId: session.user.id, action: "CREATE", entity: "Resident", entityId: resident.id, details: { name: `${firstName} ${lastName}`, purok } });

    return NextResponse.json(resident, { status: 201 });
  } catch (error) {
    console.error("POST /api/residents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    if (!["ADMIN", "SECRETARY"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { ids } = body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No resident IDs provided" }, { status: 400 });
    }

    await prisma.resident.deleteMany({ where: { id: { in: ids } } });

    logAudit({ userId: session.user.id, action: "DELETE", entity: "Resident", entityId: ids.join(","), details: { count: ids.length } });

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error("DELETE /api/residents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
