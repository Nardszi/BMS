import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { officialSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const officials = await prisma.official.findMany({
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { termStart: "desc" },
    });

    return NextResponse.json(officials);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole([Role.ADMIN]);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const parsed = officialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { userId, position, termStart, termEnd } = parsed.data;

    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingOfficial = await prisma.official.findUnique({ where: { userId } });
    if (existingOfficial) {
      return NextResponse.json({ error: "User is already an official" }, { status: 409 });
    }

    const positionTaken = await prisma.official.findFirst({ where: { position } });
    if (positionTaken) {
      return NextResponse.json({ error: `Position "${position}" is already occupied` }, { status: 409 });
    }

    const official = await prisma.official.create({
      data: {
        userId,
        position,
        termStart: new Date(termStart),
        termEnd: new Date(termEnd),
      },
      include: { user: { select: { id: true, name: true, role: true } } },
    });

    return NextResponse.json(official, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
