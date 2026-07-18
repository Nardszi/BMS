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
    const type = searchParams.get("type") || "";

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const certificates = await prisma.certificateRequest.findMany({
      where,
      include: { resident: { include: { household: true } }, issuedBy: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(certificates);
  } catch (error) {
    console.error("GET /api/certificates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { residentId, type, purpose } = body;

    if (!residentId || !type || !purpose) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!["CLEARANCE", "RESIDENCY", "INDIGENCY", "BUSINESS_PERMIT"].includes(type)) {
      return NextResponse.json({ error: "Invalid certificate type" }, { status: 400 });
    }

    const certificate = await prisma.certificateRequest.create({
      data: { residentId, type, purpose },
      include: { resident: true },
    });

    return NextResponse.json(certificate, { status: 201 });
  } catch (error) {
    console.error("POST /api/certificates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
