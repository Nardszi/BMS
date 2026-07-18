import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const officials = await prisma.official.findMany({
      include: { user: true },
      orderBy: { termStart: "desc" },
    });

    return NextResponse.json(officials);
  } catch (error) {
    console.error("GET /api/officials error:", error);
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

    const official = await prisma.official.create({
      data: { userId, position, termStart: new Date(termStart), termEnd: new Date(termEnd) },
      include: { user: true },
    });

    return NextResponse.json(official, { status: 201 });
  } catch (error) {
    console.error("POST /api/officials error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
