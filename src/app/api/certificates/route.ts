import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const type = searchParams.get("type") || "";

  const where: any = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const certificates = await prisma.certificateRequest.findMany({
    where,
    include: { resident: { include: { household: true } }, issuedBy: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(certificates);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const certificate = await prisma.certificateRequest.create({
    data: {
      residentId: body.residentId,
      type: body.type,
      purpose: body.purpose,
    },
    include: { resident: true },
  });

  return NextResponse.json(certificate, { status: 201 });
}
