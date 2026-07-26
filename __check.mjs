import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const users = await p.user.findMany();
  console.log('Users found:', users.length);
  users.forEach(u => console.log(`  ${u.email} | ${u.role}`));
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await p.$disconnect();
}
