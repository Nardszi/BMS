import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface AuditParams {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logAudit({ userId, action, entity, entityId, details, ipAddress }: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: (details as Prisma.InputJsonValue) || Prisma.JsonNull,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}
