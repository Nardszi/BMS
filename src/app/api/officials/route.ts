import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const officials = await prisma.official.findMany({
    include: { user: true },
    orderBy: { termStart: "desc" },
  });

  return NextResponse.json(officials);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const official = await prisma.official.create({
    data: {
      userId: body.userId,
      position: body.position,
      termStart: new Date(body.termStart),
      termEnd: new Date(body.termEnd),
    },
    include: { user: true },
  });

  return NextResponse.json(official, { status: 201 });
}
