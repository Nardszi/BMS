import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole([Role.ADMIN]);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.official.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("DELETE /api/officials/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole([Role.ADMIN]);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { position, termStart, termEnd } = body;

    if (!position || !termStart || !termEnd) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const official = await prisma.official.update({
      where: { id: params.id },
      data: { position, termStart: new Date(termStart), termEnd: new Date(termEnd) },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });

    return NextResponse.json(official);
  } catch (error) {
    console.error("PUT /api/officials/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
