import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { requireRole } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

const VALID_ROLES = ["ADMIN", "SECRETARY", "TREASURER", "KAGAWAD", "STAFF"] as const;

export async function GET() {
  try {
    const user = await requireRole([Role.ADMIN]);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true, lastLoginAt: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireRole([Role.ADMIN]);
    if (!currentUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { name, email, password, role: newRole } = body;

    if (!name || !email || !password || !newRole) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!VALID_ROLES.includes(newRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);

    const createdUser = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: newRole },
      select: { id: true, name: true, email: true, role: true, createdAt: true, lastLoginAt: true },
    });

    await logAudit({ userId: currentUser.id, action: "CREATE", entity: "User", entityId: createdUser.id, details: { name, email, role: newRole } }).catch(() => {});

    return NextResponse.json(createdUser, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
