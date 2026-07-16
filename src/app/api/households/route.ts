import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const households = await prisma.household.findMany({
    include: { _count: { select: { residents: true } } },
    orderBy: { householdNumber: "asc" },
  });

  return NextResponse.json(households);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const household = await prisma.household.create({
    data: {
      householdNumber: body.householdNumber,
      address: body.address,
      purok: body.purok,
      zone: body.zone,
    },
  });

  return NextResponse.json(household, { status: 201 });
}
