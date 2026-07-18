import { prisma } from "@/lib/prisma";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "DENY" | "RELEASE" | "REVOKE" | "RENEW";

interface AuditLogParams {
  userId: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logAudit({ userId, action, entity, entityId, details, ipAddress }: AuditLogParams) {
  try {
    await prisma.$executeRaw`
      INSERT INTO "AuditLog" ("id", "userId", "action", "entity", "entityId", "details", "ipAddress", "createdAt")
      VALUES (gen_random_uuid(), ${userId}, ${action}, ${entity}, ${entityId}, ${JSON.stringify(details || {})}::jsonb, ${ipAddress || null}, NOW())
    `;
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}

export async function getAuditLogs(filters?: {
  userId?: string;
  entity?: string;
  action?: string;
  limit?: number;
  offset?: number;
}) {
  const where: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters?.userId) {
    where.push(`"userId" = $${paramIndex++}`);
    params.push(filters.userId);
  }
  if (filters?.entity) {
    where.push(`"entity" = $${paramIndex++}`);
    params.push(filters.entity);
  }
  if (filters?.action) {
    where.push(`"action" = $${paramIndex++}`);
    params.push(filters.action);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  return prisma.$queryRawUnsafe(
    `SELECT al.*, u.name as "userName", u.email as "userEmail"
     FROM "AuditLog" al
     LEFT JOIN "User" u ON u.id = al."userId"
     ${whereClause}
     ORDER BY al."createdAt" DESC
     LIMIT ${limit} OFFSET ${offset}`,
    ...params
  );
}
