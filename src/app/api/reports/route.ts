import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["ADMIN", "SECRETARY", "TREASURER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") || new Date().getFullYear().toString();

    const yearStart = new Date(`${year}-01-01`);
    const yearEnd = new Date(`${year}-12-31T23:59:59`);

    const [
      purokData, genderData, certData, civilStatusData,
      totalResidents, totalHouseholds, voterCount, permitStats,
      blotterStats, monthlyResidents, monthlyCerts, householdSizes,
    ] = await Promise.all([
      prisma.$queryRaw<{ purok: string; count: bigint; households: bigint }[]>`
        SELECT h.purok, COUNT(r.id) as count, COUNT(DISTINCT h.id) as households
        FROM "Household" h LEFT JOIN "Resident" r ON r."householdId" = h.id
        GROUP BY h.purok ORDER BY h.purok
      `,
      prisma.resident.groupBy({ by: ["gender"], _count: true }),
      prisma.certificateRequest.groupBy({ by: ["type"], _count: true }),
      prisma.resident.groupBy({ by: ["civilStatus"], _count: true }),
      prisma.resident.count(),
      prisma.household.count(),
      prisma.resident.count({ where: { isRegisteredVoter: true } }),
      prisma.businessPermit.groupBy({ by: ["status"], _count: true }),
      prisma.blotterReport.groupBy({ by: ["status"], _count: true }),
      prisma.$queryRaw<{ month: string; count: bigint }[]>`
        SELECT TO_CHAR(r."createdAt", 'YYYY-MM') as month, COUNT(*) as count
        FROM "Resident" r
        WHERE r."createdAt" >= ${yearStart} AND r."createdAt" <= ${yearEnd}
        GROUP BY month ORDER BY month
      `,
      prisma.$queryRaw<{ month: string; count: bigint }[]>`
        SELECT TO_CHAR(c."createdAt", 'YYYY-MM') as month, COUNT(*) as count
        FROM "CertificateRequest" c
        WHERE c."createdAt" >= ${yearStart} AND c."createdAt" <= ${yearEnd}
        GROUP BY month ORDER BY month
      `,
      prisma.$queryRaw<{ avg_size: number; min_size: bigint; max_size: bigint }[]>`
        SELECT AVG(cnt)::numeric(10,1) as avg_size, MIN(cnt) as min_size, MAX(cnt) as max_size
        FROM (SELECT COUNT(r.id) as cnt FROM "Household" h LEFT JOIN "Resident" r ON r."householdId" = h.id GROUP BY h.id) sub
      `,
    ]);

    const purokDetails = purokData.map((p) => {
      const pop = Number(p.count);
      const hhs = Number(p.households);
      return { purok: `Purok ${p.purok}`, population: pop, households: hhs, avgSize: hhs > 0 ? Math.round((pop / hhs) * 10) / 10 : 0 };
    });

    const now = new Date();
    const ageGroups = { Children: 0, Adults: 0, Seniors: 0 };
    const allResidents = await prisma.resident.findMany({ select: { birthDate: true } });
    allResidents.forEach((r) => {
      const age = Math.floor((now.getTime() - new Date(r.birthDate).getTime()) / 31557600000);
      if (age < 18) ageGroups.Children++;
      else if (age < 60) ageGroups.Adults++;
      else ageGroups.Seniors++;
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyResidentTrend = monthNames.map((name, i) => {
      const m = `${year}-${String(i + 1).padStart(2, "0")}`;
      const found = monthlyResidents.find((r) => r.month === m);
      return { month: name, residents: found ? Number(found.count) : 0 };
    });
    const monthlyCertTrend = monthNames.map((name, i) => {
      const m = `${year}-${String(i + 1).padStart(2, "0")}`;
      const found = monthlyCerts.find((c) => c.month === m);
      return { month: name, certificates: found ? Number(found.count) : 0 };
    });

    const permitMap: Record<string, number> = {};
    permitStats.forEach((p) => { permitMap[p.status] = p._count; });
    const blotterMap: Record<string, number> = {};
    blotterStats.forEach((b) => { blotterMap[b.status] = b._count; });

    const sorted = [...purokDetails].sort((a, b) => b.population - a.population);

    return NextResponse.json({
      populationByPurok: purokDetails.map((p) => ({ purok: p.purok, count: p.population })),
      purokDetails,
      genderBreakdown: genderData.map((g) => ({ gender: g.gender, count: g._count })),
      certificatesByType: certData.map((c) => ({ type: c.type, count: c._count })),
      civilStatusBreakdown: civilStatusData.map((c) => ({ status: c.civilStatus, count: c._count })),
      ageDistribution: [
        { group: "Children (0-17)", count: ageGroups.Children },
        { group: "Adults (18-59)", count: ageGroups.Adults },
        { group: "Seniors (60+)", count: ageGroups.Seniors },
      ],
      totalResidents, totalHouseholds, voterCount,
      voterPercentage: totalResidents > 0 ? Math.round((voterCount / totalResidents) * 100) : 0,
      sexRatio: (() => {
        const males = genderData.find((g) => g.gender === "MALE");
        const females = genderData.find((g) => g.gender === "FEMALE");
        const m = males ? males._count : 0;
        const f = females ? females._count : 0;
        return f > 0 ? Math.round((m / f) * 100) : 0;
      })(),
      householdStats: {
        average: householdSizes[0] ? Number(householdSizes[0].avg_size) : 0,
        min: householdSizes[0] ? Number(householdSizes[0].min_size) : 0,
        max: householdSizes[0] ? Number(householdSizes[0].max_size) : 0,
      },
      permitStats: {
        total: permitStats.reduce((sum, p) => sum + p._count, 0),
        active: permitMap["ACTIVE"] || 0, expired: permitMap["EXPIRED"] || 0, revoked: permitMap["REVOKED"] || 0,
      },
      blotterStats: {
        total: blotterStats.reduce((sum, b) => sum + b._count, 0),
        open: blotterMap["OPEN"] || 0, resolved: blotterMap["RESOLVED"] || 0, escalated: blotterMap["ESCALATED"] || 0,
      },
      monthlyResidentTrend, monthlyCertTrend,
      topPurok: sorted[0] || null, leastPurok: sorted[sorted.length - 1] || null,
    });
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
