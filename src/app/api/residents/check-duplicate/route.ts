import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const firstName = searchParams.get("firstName") || "";
    const lastName = searchParams.get("lastName") || "";
    const birthDate = searchParams.get("birthDate") || "";

    if (!firstName || !lastName || !birthDate) {
      return NextResponse.json({ exists: false });
    }

    const existing = await prisma.resident.findFirst({
      where: {
        firstName: { equals: firstName, mode: "insensitive" },
        lastName: { equals: lastName, mode: "insensitive" },
        birthDate: new Date(birthDate),
      },
      select: { id: true, firstName: true, lastName: true, status: true },
    });

    return NextResponse.json({
      exists: !!existing,
      resident: existing || null,
    });
  } catch (error) {
    console.error("GET /api/residents/check-duplicate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
