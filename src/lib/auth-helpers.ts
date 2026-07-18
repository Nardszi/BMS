import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as SessionUser;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth();
  if (!user) return null;
  if (!allowedRoles.includes(user.role)) return null;
  return user;
}

export async function requireAdmin() {
  return requireRole([Role.ADMIN]);
}

export async function requireSecretaryOrAdmin() {
  return requireRole([Role.ADMIN, Role.SECRETARY]);
}

export async function getResidentByUserId(userId: string) {
  return prisma.resident.findFirst({
    where: { id: userId },
    include: { household: true },
  });
}

export type { SessionUser };
