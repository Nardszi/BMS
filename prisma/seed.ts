import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPassword = await hash("admin123", 12);
  const secretaryPassword = await hash("secretary123", 12);
  const treasurerPassword = await hash("treasurer123", 12);
  const kagawadPassword = await hash("kagawad123", 12);
  const staffPassword = await hash("staff123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@barangay.gov" },
    update: {},
    create: {
      name: "Juan dela Cruz",
      email: "admin@barangay.gov",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const secretary = await prisma.user.upsert({
    where: { email: "secretary@barangay.gov" },
    update: {},
    create: {
      name: "Maria Santos",
      email: "secretary@barangay.gov",
      password: secretaryPassword,
      role: Role.SECRETARY,
    },
  });

  const treasurer = await prisma.user.upsert({
    where: { email: "treasurer@barangay.gov" },
    update: {},
    create: {
      name: "Pedro Reyes",
      email: "treasurer@barangay.gov",
      password: treasurerPassword,
      role: Role.TREASURER,
    },
  });

  const kagawad = await prisma.user.upsert({
    where: { email: "kagawad@barangay.gov" },
    update: {},
    create: {
      name: "Jose Garcia",
      email: "kagawad@barangay.gov",
      password: kagawadPassword,
      role: Role.KAGAWAD,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@barangay.gov" },
    update: {},
    create: {
      name: "Ana Lopez",
      email: "staff@barangay.gov",
      password: staffPassword,
      role: Role.STAFF,
    },
  });

  console.log("Users created:", { admin: admin.name, secretary: secretary.name, treasurer: treasurer.name, kagawad: kagawad.name, staff: staff.name });

  const h1 = await prisma.household.upsert({
    where: { householdNumber: "IX-001" },
    update: {},
    create: {
      householdNumber: "IX-001",
      address: "123 Rizal Street",
      purok: "1",
    },
  });

  const h2 = await prisma.household.upsert({
    where: { householdNumber: "IX-002" },
    update: {},
    create: {
      householdNumber: "IX-002",
      address: "456 Mabini Street",
      purok: "2",
    },
  });

  const h3 = await prisma.household.upsert({
    where: { householdNumber: "IX-003" },
    update: {},
    create: {
      householdNumber: "IX-003",
      address: "789 Bonifacio Avenue",
      purok: "3",
    },
  });

  const h4 = await prisma.household.upsert({
    where: { householdNumber: "IX-004" },
    update: {},
    create: {
      householdNumber: "IX-004",
      address: "321 Aguinaldo Drive",
      purok: "1",
    },
  });

  const h5 = await prisma.household.upsert({
    where: { householdNumber: "IX-005" },
    update: {},
    create: {
      householdNumber: "IX-005",
      address: "654 Luna Street",
      purok: "4",
    },
  });

  const residents = [
    { firstName: "Pedro", lastName: "Santos", middleName: "Garcia", gender: "MALE" as const, civilStatus: "MARRIED" as const, householdId: h1.id, occupation: "Farmer", contactNumber: "09123456789", isRegisteredVoter: true, birthDate: new Date("1985-03-15") },
    { firstName: "Juanita", lastName: "Santos", middleName: "Reyes", gender: "FEMALE" as const, civilStatus: "MARRIED" as const, householdId: h1.id, occupation: "Housewife", contactNumber: "09123456790", isRegisteredVoter: true, birthDate: new Date("1987-07-22") },
    { firstName: "Miguel", lastName: "Santos", middleName: "", gender: "MALE" as const, civilStatus: "SINGLE" as const, householdId: h1.id, occupation: "Student", contactNumber: "", isRegisteredVoter: false, birthDate: new Date("2005-11-10") },
    { firstName: "Ricardo", lastName: "Cruz", middleName: "Bautista", gender: "MALE" as const, civilStatus: "SINGLE" as const, householdId: h2.id, occupation: "Mechanic", contactNumber: "09234567890", isRegisteredVoter: true, birthDate: new Date("1990-01-30") },
    { firstName: "Elena", lastName: "Cruz", middleName: "Dela Peña", gender: "FEMALE" as const, civilStatus: "WIDOWED" as const, householdId: h2.id, occupation: "Vendor", contactNumber: "09345678901", isRegisteredVoter: true, birthDate: new Date("1965-05-18") },
    { firstName: "Roberto", lastName: "Reyes", middleName: "Mendoza", gender: "MALE" as const, civilStatus: "MARRIED" as const, householdId: h3.id, occupation: "Teacher", contactNumber: "09456789012", isRegisteredVoter: true, birthDate: new Date("1978-09-25") },
    { firstName: "Gloria", lastName: "Reyes", middleName: "Lopez", gender: "FEMALE" as const, civilStatus: "MARRIED" as const, householdId: h3.id, occupation: "Nurse", contactNumber: "09567890123", isRegisteredVoter: true, birthDate: new Date("1980-12-05") },
    { firstName: "Fernando", lastName: "Garcia", middleName: "Torres", gender: "MALE" as const, civilStatus: "DIVORCED" as const, householdId: h4.id, occupation: "Tricycle Driver", contactNumber: "09678901234", isRegisteredVoter: true, birthDate: new Date("1972-04-12") },
    { firstName: "Lourdes", lastName: "Garcia", middleName: "", gender: "FEMALE" as const, civilStatus: "SINGLE" as const, householdId: h4.id, occupation: "Student", contactNumber: "", isRegisteredVoter: false, birthDate: new Date("2003-08-20") },
    { firstName: "Antonio", lastName: "Mendoza", middleName: "Ramos", gender: "MALE" as const, civilStatus: "SINGLE" as const, householdId: h5.id, occupation: "Construction Worker", contactNumber: "09789012345", isRegisteredVoter: true, birthDate: new Date("1995-02-14") },
  ];

  for (const r of residents) {
    await prisma.resident.create({ data: r });
  }

  console.log("Residents created:", residents.length);

  await prisma.official.create({
    data: {
      userId: admin.id,
      position: "Barangay Captain",
      termStart: new Date("2023-01-01"),
      termEnd: new Date("2026-12-31"),
    },
  });

  await prisma.official.create({
    data: {
      userId: secretary.id,
      position: "Barangay Secretary",
      termStart: new Date("2023-01-01"),
      termEnd: new Date("2026-12-31"),
    },
  });

  console.log("Officials created");

  await prisma.announcement.create({
    data: {
      title: "Barangay Assembly Meeting",
      content: "All residents are invited to attend the Barangay Assembly Meeting on Saturday at the Barangay Hall. Agenda includes the annual budget and community projects.",
      postedById: admin.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
