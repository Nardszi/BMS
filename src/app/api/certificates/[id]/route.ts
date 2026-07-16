import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const role = (session.user as any).role;

  if (body.status && !["ADMIN", "SECRETARY"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const certificate = await prisma.certificateRequest.update({
    where: { id: params.id },
    data: {
      status: body.status,
      releaseDate: body.status === "RELEASED" ? new Date() : undefined,
      issuedById: body.status === "APPROVED" ? (session.user as any).id : undefined,
    },
    include: { resident: true },
  });

  return NextResponse.json(certificate);
}
