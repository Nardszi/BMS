import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateCheck = checkRateLimit(`register:${ip}`, RATE_LIMITS.register);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 });
    }

    const body = await request.json();

    const requiredFields = ["firstName", "lastName", "birthDate", "gender", "civilStatus", "address", "purok", "contactNumber"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    // Find or create household for the purok
    let household = await prisma.household.findFirst({
      where: { purok: body.purok, address: body.address },
    });

    if (!household) {
      const count = await prisma.household.count();
      household = await prisma.household.create({
        data: {
          householdNumber: `REG-${Date.now().toString(36).toUpperCase()}`,
          address: body.address,
          purok: body.purok,
          zone: body.zone || null,
        },
      });
    }

    const resident = await prisma.resident.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        middleName: body.middleName || null,
        birthDate: new Date(body.birthDate),
        gender: body.gender,
        civilStatus: body.civilStatus,
        householdId: household.id,
        occupation: body.occupation || null,
        contactNumber: body.contactNumber,
        emergencyContact: body.emergencyContact || null,
        emergencyPhone: body.emergencyPhone || null,
        isRegisteredVoter: body.isRegisteredVoter || false,
        status: "PENDING",
      },
    });

    const refNumber = `REG-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      message: "Registration successful! Your records have been submitted to the barangay for verification.",
      residentId: resident.id,
      referenceNumber: refNumber,
    }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Failed to process registration" }, { status: 500 });
  }
}
