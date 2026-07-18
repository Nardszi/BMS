import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
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
    return NextResponse.json({ exists: false });
  }
}
