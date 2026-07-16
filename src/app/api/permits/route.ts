import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const expiringSoon = searchParams.get("expiringSoon") === "true";

  const where: any = {};
  if (status) where.status = status;
  if (expiringSoon) {
    where.status = "ACTIVE";
    where.expiryDate = { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) };
  }

  const permits = await prisma.businessPermit.findMany({
    where,
    include: { owner: true },
    orderBy: { expiryDate: "asc" },
  });

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
  const permit = await prisma.businessPermit.create({
    data: {
      businessName: body.businessName,
      ownerResidentId: body.ownerResidentId,
      businessType: body.businessType,
      address: body.address,
      permitNumber: body.permitNumber,
      issueDate: new Date(body.issueDate),
      expiryDate: new Date(body.expiryDate),
    },
    include: { owner: true },
  });

  return NextResponse.json(permit, { status: 201 });
}
