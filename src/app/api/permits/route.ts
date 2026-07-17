import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generatePermitNumber(): string {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `BP-${year}-${code}`;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const expiringSoon = searchParams.get("expiringSoon") === "true";
  const search = searchParams.get("search") || "";

  const where: any = {};
  if (status) where.status = status;
  if (expiringSoon) {
    where.status = "ACTIVE";
    where.expiryDate = { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) };
  }
  if (search) {
    where.OR = [
      { businessName: { contains: search, mode: "insensitive" } },
      { permitNumber: { contains: search, mode: "insensitive" } },
      { owner: { firstName: { contains: search, mode: "insensitive" } } },
      { owner: { lastName: { contains: search, mode: "insensitive" } } },
    ];
  }

  const permits = await prisma.businessPermit.findMany({
    where,
    include: { owner: true },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const toUpdate = permits.filter(
    (p) => p.status === "ACTIVE" && new Date(p.expiryDate) < now
  );
  if (toUpdate.length > 0) {
    await prisma.businessPermit.updateMany({
      where: { id: { in: toUpdate.map((p) => p.id) } },
      data: { status: "EXPIRED" },
    });
    toUpdate.forEach((p) => (p.status = "EXPIRED"));
  }

  return NextResponse.json(permits);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["ADMIN", "TREASURER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  let permitNumber: string;
  let attempts = 0;
  do {
    permitNumber = generatePermitNumber();
    attempts++;
  } while (
    await prisma.businessPermit.findUnique({ where: { permitNumber } })
  );

  const permit = await prisma.businessPermit.create({
    data: {
      businessName: body.businessName,
      ownerResidentId: body.ownerResidentId,
      businessType: body.businessType,
      address: body.address,
      permitNumber,
      issueDate: new Date(body.issueDate),
      expiryDate: new Date(body.expiryDate),
    },
    include: { owner: true },
  });

  return NextResponse.json(permit, { status: 201 });
}
