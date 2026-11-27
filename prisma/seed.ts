import { PrismaClient, Role, UserType, PermitStatus, VisitStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash(process.env.DEMO_PASSWORD || "ChangeMe123!", 12);

  const gates = await Promise.all([
    prisma.gate.upsert({ where: { name: "Main Gate" }, update: { active: true }, create: { name: "Main Gate", description: "Primary visitor entrance" } }),
    prisma.gate.upsert({ where: { name: "Gate 2" }, update: { active: true }, create: { name: "Gate 2", description: "Secondary entrance" } }),
    prisma.gate.upsert({ where: { name: "FPG Gate" }, update: { active: true }, create: { name: "FPG Gate", description: "FPG entrance" } }),
    prisma.gate.upsert({ where: { name: "AFIT Gate" }, update: { active: true }, create: { name: "AFIT Gate", description: "AFIT campus entrance" } }),
  ]);

  // Admin — mustChangePassword: false so they can log in immediately in dev
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { fullName: "Estate Administrator", active: true, mustChangePassword: false },
    create: {
      email: "admin@example.com", passwordHash: password, role: Role.ADMIN,
      fullName: "Estate Administrator", userType: UserType.PERSONNEL,
      serviceNumber: "NAF/ADMIN1", mustChangePassword: false,
    },
  });

  // Residents
  const residentData = [
    { email: "resident@example.com", fullName: "Ibrahim Musa", serviceNumber: "NAF/12345", houseNumber: "Block B, Flat 12", phone: "08030000001" },
    { email: "adeola@example.com",   fullName: "Adeola Johnson", serviceNumber: "NAF/23456", houseNumber: "Block C, Flat 18", phone: "08030000002" },
    { email: "chinedu@example.com",  fullName: "Chinedu Okafor", serviceNumber: "NAF/34567", houseNumber: "House 24",        phone: "08030000003" },
    { email: "fatima@example.com",   fullName: "Fatima Bello",   serviceNumber: null,         houseNumber: "Block A, Flat 06", phone: "08030000004" }, // CIVILIAN
  ];

  for (const d of residentData) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: { fullName: d.fullName, active: true, mustChangePassword: false, serviceNumber: d.serviceNumber || null, userType: d.serviceNumber ? UserType.PERSONNEL : UserType.CIVILIAN },
      create: {
        email: d.email, passwordHash: password, role: Role.RESIDENT, fullName: d.fullName,
        userType: d.serviceNumber ? UserType.PERSONNEL : UserType.CIVILIAN,
        serviceNumber: d.serviceNumber || null, mustChangePassword: false,
      },
    });
    await prisma.resident.upsert({
      where: { userId: user.id },
      update: { houseNumber: d.houseNumber, phone: d.phone },
      create: { userId: user.id, houseNumber: d.houseNumber, phone: d.phone },
    });
  }

  // Guards
  const guardData = [
    { email: "guard@example.com",  fullName: "Musa Ibrahim", serviceNumber: "NAF/67890", gateIndex: 0 },
    { email: "guard2@example.com", fullName: "Emeka Obi",    serviceNumber: "NAF/78901", gateIndex: 1 },
  ];

  for (const d of guardData) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: { fullName: d.fullName, active: true, mustChangePassword: false, serviceNumber: d.serviceNumber, userType: UserType.PERSONNEL },
      create: {
        email: d.email, passwordHash: password, role: Role.GUARD, fullName: d.fullName,
        userType: UserType.PERSONNEL, serviceNumber: d.serviceNumber, mustChangePassword: false,
      },
    });
    await prisma.guard.upsert({
      where: { userId: user.id },
      update: { assignedGateId: gates[d.gateIndex].id },
      create: { userId: user.id, assignedGateId: gates[d.gateIndex].id },
    });
  }

  // Demo permit
  const resident = await prisma.resident.findFirst({ where: { user: { email: "resident@example.com" } } });
  if (resident) {
    const visitDate = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z');
    const permitNumber = `EST-${visitDate.toISOString().slice(0, 10).replaceAll("-", "")}-DEMO1`;
    const existing = await prisma.permit.findUnique({ where: { permitNumber } });
    if (!existing) {
    const visitor = await prisma.visitor.create({ data: { fullName: "John Adewale", phone: "08031234567" } });
    const raw = crypto.randomBytes(32).toString("hex");
    const permit = await prisma.permit.create({
      data: {
        permitNumber: `EST-${visitDate.toISOString().slice(0, 10).replaceAll("-", "")}-DEMO1`,
        qrTokenHash: crypto.createHash("sha256").update(raw).digest("hex"),
        residentId: resident.id,
        visitorId: visitor.id,
        purpose: "Personal Visit",
        visitDate,
        startTime: "08:00",
        endTime: "20:00",
        status: PermitStatus.APPROVED,
        visit: { create: { status: VisitStatus.EXPECTED } },
      },
    });
    console.log("Seeded permit", permit.permitNumber);
    } // end if (!existing)
  }

  // Default permit rule
  const existingRule = await prisma.permitRule.findFirst({ where: { active: true } });
  if (!existingRule) {
    await prisma.permitRule.create({ data: { name: "Standard Rule", maxFreeDays: 30, chargePerDay: 500, currency: "NGN", active: true } });
  }

  await prisma.systemSetting.upsert({ where: { key: "retention_days" }, update: { value: "60" }, create: { key: "retention_days", value: "60" } });

  console.log("Seed complete.");
  console.log("Login credentials (password: ChangeMe123!):");
  console.log("  Admin:    admin@example.com  or  NAF/ADMIN1");
  console.log("  Resident: resident@example.com  or  NAF/12345");
  console.log("  Guard:    guard@example.com  or  NAF/67890");
}

main().finally(() => prisma.$disconnect());
