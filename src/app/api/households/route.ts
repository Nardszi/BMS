import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const households = await prisma.household.findMany({
      include: { _count: { select: { residents: true } } },
      orderBy: { householdNumber: "asc" },
    });

    return NextResponse.json(households);
  } catch (error) {
    console.error("GET /api/households error:", error);
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
    const { householdNumber, address, purok, zone } = body;

    if (!householdNumber || !address || !purok) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const household = await prisma.household.create({
      data: { householdNumber, address, purok, zone: zone || null },
    });

    return NextResponse.json(household, { status: 201 });
  } catch (error) {
    console.error("POST /api/households error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
