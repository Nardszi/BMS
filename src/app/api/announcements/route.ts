import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { announcementSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    if (!["ADMIN", "SECRETARY"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = announcementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { title, content, expiresAt, priority, category, pinned, imageUrl } = parsed.data;

    const announcement = await prisma.announcement.create({
      data: {
        title, content,
        postedById: session.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        priority: priority || "GENERAL",
        category: category || "GENERAL",
        pinned: pinned || false,
        imageUrl: imageUrl || null,
      },
      include: { postedBy: { select: { name: true } } },
    });

    logAudit({ userId: session.user.id, action: "CREATE", entity: "Announcement", entityId: announcement.id, details: { title } });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("POST /api/announcements error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
