import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
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

    const count = await prisma.resident.count();
    const refNumber = `REG-${new Date().getFullYear()}-${String(count).padStart(4, "0")}`;

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
