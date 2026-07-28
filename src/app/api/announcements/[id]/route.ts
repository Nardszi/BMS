import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

const VALID_PRIORITIES = ["URGENT", "IMPORTANT", "GENERAL"] as const;
const VALID_CATEGORIES = ["HEALTH", "SAFETY", "EVENT", "MEETING", "GENERAL", "OTHERS"] as const;

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole([Role.ADMIN, Role.SECRETARY]);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }
    if (body.category && !VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const announcement = await prisma.announcement.update({
      where: { id: params.id },
      data: {
        title: body.title,
        content: body.content,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        priority: body.priority,
        category: body.category,
        pinned: body.pinned,
        imageUrl: body.imageUrl || null,
      },
    });

    await logAudit({ userId: user.id, action: "UPDATE", entity: "Announcement", entityId: params.id, details: { title: body.title } }).catch(() => {});

    return NextResponse.json(announcement);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    if (body.viewCount !== undefined) {
      const announcement = await prisma.announcement.update({
        where: { id: params.id },
        data: { viewCount: { increment: 1 } },
      });
      return NextResponse.json(announcement);
    }

    if (body.pinned !== undefined) {
      if (user.role !== Role.ADMIN && user.role !== Role.SECRETARY) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const announcement = await prisma.announcement.update({
        where: { id: params.id },
        data: { pinned: body.pinned },
      });
      return NextResponse.json(announcement);
    }

    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole([Role.ADMIN, Role.SECRETARY]);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.announcement.delete({ where: { id: params.id } });

    await logAudit({ userId: user.id, action: "DELETE", entity: "Announcement", entityId: params.id }).catch(() => {});

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
