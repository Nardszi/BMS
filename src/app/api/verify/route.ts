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
    select: {
      idNumber: true,
      status: true,
      issueDate: true,
      expiryDate: true,
      resident: {
        select: {
          firstName: true,
          lastName: true,
          middleName: true,
        },
      },
    },
  });

  if (!barangayId) {
    return NextResponse.json({ error: "ID not found" }, { status: 404 });
  }

  const name = `${barangayId.resident.lastName}, ${barangayId.resident.firstName}${barangayId.resident.middleName ? ` ${barangayId.resident.middleName}` : ""}`;

  return NextResponse.json({
    idNumber: barangayId.idNumber,
    status: barangayId.status,
    issueDate: barangayId.issueDate,
    expiryDate: barangayId.expiryDate,
    resident: { name },
    verified: true,
  });
}
