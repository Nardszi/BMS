import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [totalResidents, pendingCertificates, openBlotterCases, activePermits, expiringSoonPermits, announcements] = await Promise.all([
    prisma.resident.count(),
    prisma.certificateRequest.count({ where: { status: "PENDING" } }),
    prisma.blotterReport.count({ where: { status: "OPEN" } }),
    prisma.businessPermit.count({ where: { status: "ACTIVE" } }),
    prisma.businessPermit.count({
      where: {
        status: "ACTIVE",
        expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      where: {
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    }),
  ]);

  return NextResponse.json({
    totalResidents,
    pendingCertificates,
    openBlotterCases,
    activePermits,
    expiringSoonPermits,
    announcements,
  });
}
