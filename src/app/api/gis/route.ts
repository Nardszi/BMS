import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PUROK_OPTIONS } from "@/lib/constants";

// Geocoordinates for Puroks/Sitios in Barangay IX - Daan Banwa, Victorias City, Negros Occidental
const PUROK_COORDINATES: Record<string, [number, number]> = {
  "1": [10.9080, 123.0585],
  "2": [10.9080, 123.0611],
  "3": [10.9080, 123.0637],
  "4": [10.9042, 123.0575],
  "5": [10.9042, 123.0611],
  "6": [10.9042, 123.0647],
  "7": [10.9004, 123.0585],
  "8": [10.9004, 123.0611],
  "Toreno": [10.9004, 123.0637],
  "Aji": [10.8966, 123.0611],
};

// Deterministic pseudo-random offset for placing markers within a purok area (smaller offset to prevent overlapping outside purok)
function getOffsetCoords(baseLat: number, baseLng: number, seed: string): [number, number] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = (((hash % 1000) / 1000) - 0.5) * 0.0008;
  const lngOffset = ((((hash >> 3) % 1000) / 1000) - 0.5) * 0.0008;
  return [baseLat + latOffset, baseLng + lngOffset];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [households, residents, permits, blotters] = await Promise.all([
      prisma.household.findMany({
        select: { id: true, purok: true, householdNumber: true, address: true },
      }),
      prisma.resident.findMany({
        where: { status: "APPROVED" },
        select: { id: true, householdId: true, gender: true, isRegisteredVoter: true },
      }),
      prisma.businessPermit.findMany({
        select: {
          id: true,
          businessName: true,
          businessType: true,
          status: true,
          address: true,
          permitNumber: true,
          owner: {
            select: {
              firstName: true,
              lastName: true,
              household: { select: { purok: true } },
            },
          },
        },
      }),
      prisma.blotterReport.findMany({
        select: {
          id: true,
          caseNumber: true,
          incidentType: true,
          incidentDate: true,
          status: true,
          complainantName: true,
          respondentName: true,
          location: true,
          narrative: true,
        },
      }),
    ]);

    // Group population and households by Purok
    const purokStats: Record<string, {
      purok: string;
      center: [number, number];
      population: number;
      households: number;
      voters: number;
      males: number;
      females: number;
      businessCount: number;
      blotterCount: number;
    }> = {};

    Object.keys(PUROK_COORDINATES).forEach((purok) => {
      purokStats[purok] = {
        purok,
        center: PUROK_COORDINATES[purok],
        population: 0,
        households: 0,
        voters: 0,
        males: 0,
        females: 0,
        businessCount: 0,
        blotterCount: 0,
      };
    });

    const householdPurokMap: Record<string, string> = {};
    households.forEach((h) => {
      householdPurokMap[h.id] = h.purok;
      if (!purokStats[h.purok]) {
        const defaultCenter: [number, number] = [10.9042, 123.0611];
        purokStats[h.purok] = {
          purok: h.purok,
          center: PUROK_COORDINATES[h.purok] || defaultCenter,
          population: 0,
          households: 0,
          voters: 0,
          males: 0,
          females: 0,
          businessCount: 0,
          blotterCount: 0,
        };
      }
      purokStats[h.purok].households += 1;
    });

    residents.forEach((r) => {
      const purok = householdPurokMap[r.householdId];
      if (purok && purokStats[purok]) {
        purokStats[purok].population += 1;
        if (r.isRegisteredVoter) purokStats[purok].voters += 1;
        if (r.gender === "MALE") purokStats[purok].males += 1;
        if (r.gender === "FEMALE") purokStats[purok].females += 1;
      }
    });

    // Map permits with coordinates
    const permitMarkers = permits.map((p) => {
      const purok = p.owner?.household?.purok || "1";
      const baseCenter = PUROK_COORDINATES[purok] || [10.9042, 123.0611];
      if (purokStats[purok]) purokStats[purok].businessCount += 1;
      const coords = getOffsetCoords(baseCenter[0], baseCenter[1], p.id);
      return {
        id: p.id,
        businessName: p.businessName,
        businessType: p.businessType,
        status: p.status,
        permitNumber: p.permitNumber,
        address: p.address,
        ownerName: `${p.owner?.firstName} ${p.owner?.lastName}`,
        purok,
        coordinates: coords,
      };
    });

    // Map blotter reports with coordinates
    const blotterMarkers = blotters.map((b) => {
      let purok = "1";
      const match = b.location?.match(/(?:Purok\s*(\d+|Toreno|Aji)|(Toreno|Aji))/i);
      const matchedPurok = match ? (match[1] || match[2]) : null;
      if (matchedPurok && PUROK_COORDINATES[matchedPurok]) {
        purok = matchedPurok;
      } else {
        const charCodeSum = b.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        purok = PUROK_OPTIONS[charCodeSum % PUROK_OPTIONS.length];
      }

      if (purokStats[purok]) purokStats[purok].blotterCount += 1;

      const baseCenter = PUROK_COORDINATES[purok] || [10.9042, 123.0611];
      const coords = getOffsetCoords(baseCenter[0], baseCenter[1], b.id);

      return {
        id: b.id,
        caseNumber: b.caseNumber,
        incidentType: b.incidentType,
        incidentDate: b.incidentDate,
        status: b.status,
        complainantName: b.complainantName,
        respondentName: b.respondentName,
        location: b.location || `Purok ${purok}`,
        narrative: b.narrative,
        purok,
        coordinates: coords,
      };
    });

    return NextResponse.json({
      puroks: Object.values(purokStats),
      permits: permitMarkers,
      blotters: blotterMarkers,
      center: [10.9007, 123.0725], // Victorias City overview center
    });
  } catch (error) {
    console.error("GET /api/gis error:", error);
    return NextResponse.json({ error: "Failed to fetch GIS data" }, { status: 500 });
  }
}
