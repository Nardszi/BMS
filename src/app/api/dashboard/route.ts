import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [
      totalResidents, pendingCertificates, openBlotterCases, activePermits,
      expiringSoonPermits, totalHouseholds, totalOfficials, announcements, recentCertificates,
      purokCounts,
    ] = await Promise.all([
      prisma.resident.count(),
      prisma.certificateRequest.count({ where: { status: "PENDING" } }),
      prisma.blotterReport.count({ where: { status: "OPEN" } }),
      prisma.businessPermit.count({ where: { status: "ACTIVE" } }),
      prisma.businessPermit.count({
        where: { status: "ACTIVE", expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.household.count(),
      prisma.official.count(),
      prisma.announcement.findMany({
        orderBy: { createdAt: "desc" }, take: 5,
        include: { postedBy: { select: { name: true } } },
        where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      }),
      prisma.certificateRequest.findMany({
        orderBy: { createdAt: "desc" }, take: 5,
        include: { resident: { select: { firstName: true, lastName: true } } },
      }),
      prisma.$queryRaw<{ purok: string; count: number }[]>`
        SELECT h.purok, COUNT(r.id)::int as count
        FROM "Household" h
        LEFT JOIN "Resident" r ON r."householdId" = h.id AND r.status = 'APPROVED'
        GROUP BY h.purok
        ORDER BY h.purok
      `,
    ]);

    return NextResponse.json({
      totalResidents, pendingCertificates, openBlotterCases, activePermits,
      expiringSoonPermits, totalHouseholds, totalOfficials, announcements, recentCertificates,
      purokCounts,
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
