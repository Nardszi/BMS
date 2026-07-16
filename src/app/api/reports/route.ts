import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [purokData, genderData, certData, totalResidents, totalHouseholds, voterCount] = await Promise.all([
    prisma.$queryRaw<{ purok: string; count: bigint }[]>`
      SELECT h.purok, COUNT(r.id) as count
      FROM "Household" h
      LEFT JOIN "Resident" r ON r."householdId" = h.id
      GROUP BY h.purok
      ORDER BY h.purok
    `,
    prisma.resident.groupBy({
      by: ["gender"],
      _count: true,
    }),
    prisma.certificateRequest.groupBy({
      by: ["type"],
      _count: true,
    }),
    prisma.resident.count(),
    prisma.household.count(),
    prisma.resident.count({ where: { isRegisteredVoter: true } }),
  ]);

  return NextResponse.json({
    populationByPurok: purokData.map((p) => ({
      purok: `Purok ${p.purok}`,
      count: Number(p.count),
    })),
    genderBreakdown: genderData.map((g) => ({
      gender: g.gender,
      count: g._count,
    })),
    certificatesByType: certData.map((c) => ({
      type: c.type,
      count: c._count,
    })),
    totalResidents,
    totalHouseholds,
    voterCount,
  });
}
