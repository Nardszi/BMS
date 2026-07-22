import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Geocoordinates for Puroks in Barangay IX - Daan Banwa, Victorias City, Negros Occidental
const PUROK_COORDINATES: Record<string, [number, number]> = {
  "1": [10.8986, 123.0786],
  "2": [10.8998, 123.0801],
  "3": [10.8972, 123.0792],
  "4": [10.8961, 123.0775],
  "5": [10.8950, 123.0760],
  "6": [10.8965, 123.0745],
  "7": [10.8980, 123.0735],
  "8": [10.8995, 123.0750],
  "9": [10.9010, 123.0768],
  "10": [10.9022, 123.0785],
};

// Deterministic pseudo-random offset for placing markers within a purok area
function getOffsetCoords(baseLat: number, baseLng: number, seed: string): [number, number] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = (((hash % 1000) / 1000) - 0.5) * 0.003;
  const lngOffset = ((((hash >> 3) % 1000) / 1000) - 0.5) * 0.003;
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
        const defaultCenter: [number, number] = [10.8986, 123.0786];
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
      const baseCenter = PUROK_COORDINATES[purok] || [10.8986, 123.0786];
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
      // Try to extract purok from location string if mentioned
      let purok = "1";
      const match = b.location?.match(/Purok\s*(\d+)/i);
      if (match && PUROK_COORDINATES[match[1]]) {
        purok = match[1];
      } else {
        // Fallback modulo distribution for visualization consistency
        const charCodeSum = b.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        purok = String((charCodeSum % 10) + 1);
      }

      if (purokStats[purok]) purokStats[purok].blotterCount += 1;

      const baseCenter = PUROK_COORDINATES[purok] || [10.8986, 123.0786];
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
      center: [10.8986, 123.0786], // Barangay IX center
    });
  } catch (error) {
    console.error("GET /api/gis error:", error);
    return NextResponse.json({ error: "Failed to fetch GIS data" }, { status: 500 });
  }
}
