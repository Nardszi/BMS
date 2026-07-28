import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { requireRole } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

const VALID_ROLES = ["ADMIN", "SECRETARY", "TREASURER", "KAGAWAD", "STAFF"] as const;

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await requireRole([Role.ADMIN]);
    if (!currentUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { name, email, role: newRole, password } = body;

    if (!name || !email || !newRole) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!VALID_ROLES.includes(newRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const data: any = { name, email, role: newRole };
    if (password) {
      data.password = await hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true, lastLoginAt: true },
    });

    await logAudit({ userId: currentUser.id, action: "UPDATE", entity: "User", entityId: params.id, details: { name, email, role: newRole } }).catch(() => {});

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await requireRole([Role.ADMIN]);
    if (!currentUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (currentUser.id === params.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: params.id } });

    await logAudit({ userId: currentUser.id, action: "DELETE", entity: "User", entityId: params.id }).catch(() => {});

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
