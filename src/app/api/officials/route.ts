import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, position, termStart, termEnd } = body;

    if (!userId || !position || !termStart || !termEnd) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

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
