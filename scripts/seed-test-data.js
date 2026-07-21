const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();

const firstNames = ["Juan", "Maria", "Jose", "Ana", "Pedro", "Rosa", "Manuel", "Luz", "Antonio", "Carmen", "Francisco", "Teresa", "Ricardo", "Elena", "Carlos", "Patricia", "Eduardo", "Gloria", "Ramon", "Linda", "Fernando", "Susan", "Roberto", "Nancy", "Miguel", "Sandra", "Alfredo", "Deborah", "Arturo", "Laura", "Oscar", "Jessica", "Raul", "Monica", "Gerald", "Marites", "Rene", "Lolita", "Danilo", "Vilma", "Rolando", "Evelyn", "Gregorio", "Fe", "Leo", "Ruby", "Joel", "Grace", "Dennis", "Ruby", "Mark", "Sarah", "Paul", "Michelle", "Benjamin", "Kimberly", "Samuel", "Angela", "Jerome", "Nicole", "Alexander", "Stephanie", "Raymond", "Christine", "Christopher", "Vanessa", "Andrew", "Brianna", "Daniel", "Amber", "Joshua", "Crystal", "Kevin", "Brittany", "Brian", "Danielle", "Timothy", "Megan", "Jason", "Tiffany", "Jeffrey", "Rebecca", "Ryan", "Rachel", "Jacob", "Lauren", "Gary", "Amber", "Nicholas", "Samantha", "Eric", "Katherine", "Jonathan", "Victoria", "Stephen", "Christina", "Larry", "Michelle", "Justin", "Stephanie"];

const lastNames = ["Dela Cruz", "Santos", "Reyes", "Garcia", "Mendoza", "Torres", "Tomasi", "Ramos", "Gonzales", "Aquino", "Bautista", "Ocampo", "Lopez", "Hernandez", "Cruz", "Castillo", "Rivera", "Fernandez", "Morales", "Martinez", "Santiago", "Francisco", "De Leon", "Villanueva", "Soriano", "Padilla", "Pascual", "Mercado", "Manalo", "Lim", "Gomez", "Diaz", "Cortez", "Miranda", "Salazar", "Robles", "Marquez", "Espiritu", "Valdez", "Roxas", "Del Rosario", "Sy", "Chua", "Ong", "Tan", "Co", "Ang", "Go", "Lee", "Yap"];

const middleNames = ["Santos", "Reyes", "Cruz", "Garcia", "Lopez", "Rivera", "Gonzalez", "Mendoza", "Torres", "Ramos", "Bautista", "Aquino", "Ocampo", "Hernandez", "Castillo", "Fernandez", "Morales", "Martinez", "Santiago", "Francisco", "", "", "", "", ""];

const puroks = ["1", "2", "3", "4", "5", "6", "7", "8", "Toreno", "Aji"];
const streets = ["Main St", "Oak Ave", "Pine St", "Maple Dr", "Cedar Ln", "Birch Rd", "Elm St", "Willow Ave", "Spruce St", "Poplar Dr"];
const genders = ["MALE", "FEMALE"];
const civilStatuses = ["SINGLE", "MARRIED", "WIDOWED", "SEPARATED", "DIVORCED"];
const occupations = ["Teacher", "Nurse", "Engineer", "Farmer", "Driver", "Vendor", "Carpenter", "Mechanic", "Government Employee", "Business Owner", "OFW", "Student", "Retired", "Unemployed", "Freelancer"];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomPhone() {
  const prefix = ["0917", "0918", "0919", "0920", "0921", "0922", "0923", "0924", "0925", "0926", "0927", "0928", "0929", "0930", "0931", "0932", "0933", "0934", "0935", "0936", "0937", "0938", "0939", "0940", "0941", "0942", "0943", "0944", "0945", "0946", "0947", "0948", "0949", "0950"];
  return randomItem(prefix) + Math.floor(1000000 + Math.random() * 9000000);
}

async function main() {
  console.log("=== SEEDING 100 TEST RESIDENTS ===\n");

  // Get admin user
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    console.error("No admin user found. Create one first.");
    return;
  }
  console.log(`Using admin: ${admin.name}`);

  // Create households first
  console.log("\nCreating households...");
  const households = [];
  for (let i = 0; i < 50; i++) {
    const purok = randomItem(puroks);
    const street = randomItem(streets);
    const houseNum = Math.floor(1 + Math.random() * 200);
    const household = await prisma.household.create({
      data: {
        householdNumber: `HH-${String(i + 1).padStart(3, "0")}`,
        address: `${houseNum} ${street}`,
        purok,
      },
    });
    households.push(household);
  }
  console.log(`Created ${households.length} households`);

  // Create 100 residents
  console.log("\nCreating 100 residents...");
  const residents = [];
  for (let i = 0; i < 100; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const middleName = randomItem(middleNames);
    const gender = randomItem(genders);
    const household = randomItem(households);
    const birthDate = randomDate(new Date("1940-01-01"), new Date("2008-12-31"));
    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    const resident = await prisma.resident.create({
      data: {
        firstName,
        lastName,
        middleName: middleName || null,
        birthDate,
        gender,
        civilStatus: randomItem(civilStatuses),
        householdId: household.id,
        occupation: randomItem(occupations),
        contactNumber: randomPhone(),
        emergencyContact: Math.random() > 0.3 ? randomItem(firstNames) + " " + randomItem(lastNames) : null,
        emergencyPhone: Math.random() > 0.3 ? randomPhone() : null,
        isRegisteredVoter: age >= 18 ? Math.random() > 0.3 : false,
        status: Math.random() > 0.15 ? "APPROVED" : (Math.random() > 0.5 ? "PENDING" : "REJECTED"),
      },
    });
    residents.push(resident);
  }
  console.log(`Created ${residents.length} residents`);

  const approvedResidents = residents.filter(r => r.status === "APPROVED");
  console.log(`  - Approved: ${approvedResidents.length}`);
  console.log(`  - Pending: ${residents.filter(r => r.status === "PENDING").length}`);
  console.log(`  - Rejected: ${residents.filter(r => r.status === "REJECTED").length}`);

  // Create certificates
  console.log("\nCreating certificates...");
  const certTypes = ["CLEARANCE", "RESIDENCY", "INDIGENCY", "BUSINESS_PERMIT"];
  const purposes = ["Employment", "School Enrollment", "Bank Transaction", "Travel", "Business Application", "Legal Requirement", "Government Transaction", "ID Application"];
  let certCount = 0;
  for (const resident of approvedResidents.slice(0, 40)) {
    const year = new Date().getFullYear();
    const count = certCount + 1;
    await prisma.certificateRequest.create({
      data: {
        residentId: resident.id,
        type: randomItem(certTypes),
        purpose: randomItem(purposes),
        status: randomItem(["PENDING", "APPROVED", "RELEASED", "DENIED"]),
        referenceNumber: `IX-${year}-${String(count).padStart(3, "0")}`,
        issuedById: admin.id,
      },
    });
    certCount++;
  }
  console.log(`Created ${certCount} certificates`);

  // Create blotter reports
  console.log("\nCreating blotter reports...");
  const incidentTypes = ["Theft", "Physical Injury", "Verbal Abuse", "Property Damage", "Noise Complaint", "Domestic Dispute", "Traffic Incident", "Vandalism", "Trespassing", "Fraud"];
  let blotterCount = 0;
  for (let i = 0; i < 15; i++) {
    const complainant = randomItem(approvedResidents);
    let respondent = randomItem(approvedResidents);
    while (respondent.id === complainant.id) {
      respondent = randomItem(approvedResidents);
    }
    await prisma.blotterReport.create({
      data: {
        caseNumber: `BLT-${new Date().getFullYear()}-${String(i + 1).padStart(4, "0")}`,
        complainantName: `${complainant.firstName} ${complainant.lastName}`,
        respondentName: `${respondent.firstName} ${respondent.lastName}`,
        incidentDate: randomDate(new Date("2025-01-01"), new Date()),
        incidentType: randomItem(incidentTypes),
        location: `Purok ${randomItem(puroks)}, ${randomItem(streets)}`,
        witnesses: Math.random() > 0.5 ? `${randomItem(firstNames)} ${randomItem(lastNames)}` : null,
        narrative: `Incident of ${randomItem(incidentTypes).toLowerCase()} occurred in the area. Both parties were involved in the altercation. Witnesses were present during the incident.`,
        status: randomItem(["OPEN", "OPEN", "RESOLVED", "ESCALATED"]),
        handledById: Math.random() > 0.5 ? admin.id : null,
      },
    });
    blotterCount++;
  }
  console.log(`Created ${blotterCount} blotter reports`);

  // Create business permits
  console.log("\nCreating business permits...");
  const businessTypes = ["Sari-Sari Store", "Food Stall", "Barbershop", "Laundry Shop", "Internet Cafe", "Pharmacy", "Hardware Store", "Bakery", "Restaurant", "Tailoring Shop"];
  let permitCount = 0;
  for (const resident of approvedResidents.slice(0, 20)) {
    permitCount++;
    await prisma.businessPermit.create({
      data: {
        permitNumber: `BP-${new Date().getFullYear()}-${String(permitCount).padStart(4, "0")}`,
        businessName: `${resident.firstName}'s ${randomItem(businessTypes)}`,
        ownerResidentId: resident.id,
        businessType: randomItem(businessTypes),
        address: `${Math.floor(1 + Math.random() * 200)} ${randomItem(streets)}, Purok ${randomItem(puroks)}`,
        issueDate: randomDate(new Date("2025-01-01"), new Date()),
        expiryDate: randomDate(new Date("2026-01-01"), new Date("2027-12-31")),
        status: randomItem(["ACTIVE", "ACTIVE", "ACTIVE", "EXPIRED", "REVOKED"]),
      },
    });
  }
  console.log(`Created ${permitCount} business permits`);

  // Create barangay IDs
  console.log("\nCreating barangay IDs...");
  let idCount = 0;
  for (const resident of approvedResidents.slice(0, 30)) {
    await prisma.barangayID.create({
      data: {
        idNumber: `BID-${String(idCount + 1).padStart(3, "0")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        residentId: resident.id,
        address: `${Math.floor(1 + Math.random() * 200)} ${randomItem(streets)}, Purok ${randomItem(puroks)}`,
        contactNumber: randomPhone(),
        photoUrl: null,
        status: randomItem(["ACTIVE", "ACTIVE", "ACTIVE", "EXPIRED"]),
        issuedById: admin.id,
        issueDate: randomDate(new Date("2025-01-01"), new Date()),
        expiryDate: randomDate(new Date("2026-06-01"), new Date("2028-12-31")),
      },
    });
    idCount++;
  }
  console.log(`Created ${idCount} barangay IDs`);

  // Create announcements
  console.log("\nCreating announcements...");
  const announcementData = [
    { title: "Barangay Assembly Meeting", content: "All residents are invited to attend the quarterly barangay assembly meeting on Saturday at the Barangay Hall. Agenda includes community development projects and safety updates.", priority: "IMPORTANT", category: "MEETING" },
    { title: "Dengue Prevention Drive", content: "The barangay health office will conduct a clean-up drive this week. Please check your surroundings for stagnant water. Free consultation available at the health center.", priority: "URGENT", category: "HEALTH" },
    { title: "Road Repair Schedule", content: "Main Street will undergo repair from Monday to Wednesday. Please use alternate routes. We apologize for the inconvenience.", priority: "GENERAL", category: "GENERAL" },
    { title: "Senior Citizen Pension Distribution", content: "Senior citizens can claim their pension at the Barangay Hall from 9AM to 3PM. Bring your ID and pension card.", priority: "IMPORTANT", category: "GENERAL" },
    { title: "Basketball League Tournament", content: "The annual inter-purok basketball league will start next month. Teams can register at the Barangay Hall. Registration fee is P500 per team.", priority: "GENERAL", category: "EVENT" },
  ];
  for (const ann of announcementData) {
    await prisma.announcement.create({
      data: {
        title: ann.title,
        content: ann.content,
        postedById: admin.id,
        priority: ann.priority,
        category: ann.category,
        pinned: ann.priority === "URGENT",
      },
    });
  }
  console.log(`Created ${announcementData.length} announcements`);

  // Create officials
  console.log("\nCreating officials...");
  const positions = ["Barangay Captain", "Kagawad", "Kagawad", "Kagawad", "Kagawad", "Kagawad", "Kagawad", "Kagawad", "Secretary", "Treasurer"];
  for (let i = 0; i < Math.min(positions.length, approvedResidents.length); i++) {
    const official = approvedResidents[i];
    // Create a user for the official if they don't have one
    const existingUser = await prisma.user.findFirst({ where: { email: `${official.firstName.toLowerCase()}.${official.lastName.toLowerCase().replace(/\s/g, '')}@barangay.gov` } });
    if (!existingUser) {
      const hashedPass = await hash("password123", 10);
      const newUser = await prisma.user.create({
        data: {
          name: `${official.firstName} ${official.lastName}`,
          email: `${official.firstName.toLowerCase()}.${official.lastName.toLowerCase().replace(/\s/g, '')}@barangay.gov`,
          password: hashedPass,
          role: positions[i] === "Barangay Captain" ? "ADMIN" : (positions[i] === "Secretary" ? "SECRETARY" : (positions[i] === "Treasurer" ? "TREASURER" : "KAGAWAD")),
        },
      });
      await prisma.official.create({
        data: {
          userId: newUser.id,
          position: positions[i],
          termStart: new Date("2023-01-01"),
          termEnd: new Date("2026-12-31"),
        },
      });
    }
  }
  console.log("Created officials");

  // Summary
  console.log("\n=== SEED COMPLETE ===");
  console.log(`Residents: ${residents.length}`);
  console.log(`Households: ${households.length}`);
  console.log(`Certificates: ${certCount}`);
  console.log(`Blotter Reports: ${blotterCount}`);
  console.log(`Business Permits: ${permitCount}`);
  console.log(`Barangay IDs: ${idCount}`);
  console.log(`Announcements: ${announcementData.length}`);
  console.log(`Officials: ${positions.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
