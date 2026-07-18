import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { idNumber: { contains: search, mode: "insensitive" } },
        { resident: { firstName: { contains: search, mode: "insensitive" } } },
        { resident: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const ids = await prisma.barangayID.findMany({
      where,
      include: { resident: { include: { household: true } }, issuedBy: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(ids);
  } catch (error) {
    console.error("GET /api/barangay-ids error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["ADMIN", "SECRETARY"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { residentId, photoUrl, contactNumber, address } = body;

    if (!residentId || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.barangayID.findFirst({
      where: { residentId, status: "ACTIVE" },
    });
    if (existing) {
      return NextResponse.json({ error: "Resident already has an active Barangay ID" }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const count = await prisma.barangayID.count({
      where: { idNumber: { startsWith: `BRGY-${year}-` } },
    });
    const idNumber = `BRGY-${year}-${String(count + 1).padStart(5, "0")}`;

    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);

    const barangayId = await prisma.barangayID.create({
      data: {
        residentId, idNumber, photoUrl: photoUrl || null,
        issueDate, expiryDate, contactNumber: contactNumber || null,
        address, issuedById: (session.user as any).id,
      },
      include: { resident: { include: { household: true } }, issuedBy: true },
    });

    return NextResponse.json(barangayId, { status: 201 });
  } catch (error) {
    console.error("POST /api/barangay-ids error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
