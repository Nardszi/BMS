import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
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
    include: { postedBy: true },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(announcements);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["ADMIN", "SECRETARY"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const announcement = await prisma.announcement.create({
    data: {
      title: body.title,
      content: body.content,
      postedById: (session.user as any).id,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      priority: body.priority || "GENERAL",
      category: body.category || "GENERAL",
      pinned: body.pinned || false,
      imageUrl: body.imageUrl || null,
    },
    include: { postedBy: true },
  });

  return NextResponse.json(announcement, { status: 201 });
}
