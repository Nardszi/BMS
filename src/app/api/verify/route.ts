import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idNumber = searchParams.get("idNumber");

  if (!idNumber) {
    return NextResponse.json({ error: "ID number is required" }, { status: 400 });
  }

  const barangayId = await prisma.barangayID.findUnique({
    where: { idNumber },
    include: {
      resident: {
        include: { household: true },
        select: {
          firstName: true,
          lastName: true,
          middleName: true,
          birthDate: true,
          gender: true,
          civilStatus: true,
          contactNumber: true,
        },
      },
    },
  });

  if (!barangayId) {
    return NextResponse.json({ error: "ID not found" }, { status: 404 });
  }

  return NextResponse.json({
    idNumber: barangayId.idNumber,
    status: barangayId.status,
    issueDate: barangayId.issueDate,
    expiryDate: barangayId.expiryDate,
    resident: {
      name: `${barangayId.resident.lastName}, ${barangayId.resident.firstName} ${barangayId.resident.middleName || ""}`,
    },
  });
}
