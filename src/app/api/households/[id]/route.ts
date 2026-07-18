import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.household.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Household not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const residentCount = await tx.resident.count({ where: { householdId: params.id } });
      if (residentCount > 0) {
        throw new Error(`Cannot delete household with ${residentCount} resident(s)`);
      }
      return tx.household.delete({ where: { id: params.id } });
    });

    return NextResponse.json({ message: "Household deleted" });
  } catch (error: any) {
    if (error.message?.includes("Cannot delete household")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
