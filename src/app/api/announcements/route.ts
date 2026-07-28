import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { announcementSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const priority = searchParams.get("priority") || "";
    const category = searchParams.get("category") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }
    if (priority) where.priority = priority;
    if (category) where.category = category;

    const announcements = await prisma.announcement.findMany({
      where,
      include: { postedBy: { select: { name: true } } },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("GET /api/announcements error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole([Role.ADMIN, Role.SECRETARY]);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const parsed = announcementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { title, content, expiresAt, priority, category, pinned, imageUrl } = parsed.data;

    const announcement = await prisma.announcement.create({
      data: {
        title, content,
        postedById: user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        priority: priority || "GENERAL",
        category: category || "GENERAL",
        pinned: pinned || false,
        imageUrl: imageUrl || null,
      },
      include: { postedBy: { select: { name: true } } },
    });

    await logAudit({ userId: user.id, action: "CREATE", entity: "Announcement", entityId: announcement.id, details: { title } }).catch(() => {});

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("POST /api/announcements error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
