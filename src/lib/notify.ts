import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

interface NotifyOptions {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}

export async function createNotification({ userId, title, message, type, link }: NotifyOptions) {
  try {
    await prisma.notification.create({
      data: { userId, title, message, type, link: link || null },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function notifyUsersByRole(role: string, title: string, message: string, type: string, link?: string) {
  try {
    const users = await prisma.user.findMany({
      where: { role: role as Prisma.EnumRoleFilter["equals"] },
      select: { id: true },
    });
    for (const user of users) {
      await createNotification({ userId: user.id, title, message, type, link });
    }
  } catch (error) {
    console.error("Failed to notify users by role:", error);
  }
}

export async function notifyAllAdmins(title: string, message: string, type: string, link?: string) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    for (const admin of admins) {
      await createNotification({ userId: admin.id, title, message, type, link });
    }
  } catch (error) {
    console.error("Failed to notify admins:", error);
  }
}
