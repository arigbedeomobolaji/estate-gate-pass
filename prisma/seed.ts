import { PrismaClient, Role, PermitStatus, VisitStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
const prisma = new PrismaClient();
async function main() {
  const password = await bcrypt.hash(process.env.DEMO_PASSWORD || "ChangeMe123!", 12);
  const gates = await Promise.all([
    prisma.gate.upsert({where:{name:"Main Gate"}, update:{active:true}, create:{name:"Main Gate",description:"Primary visitor entrance"}}),
    prisma.gate.upsert({where:{name:"Gate 2"}, update:{active:true}, create:{name:"Gate 2",description:"Secondary entrance"}}),
    prisma.gate.upsert({where:{name:"Service Gate"}, update:{active:true}, create:{name:"Service Gate",description:"Service and deliveries"}})
  ]);
  const residents = [
    ["resident@example.com","Ibrahim Musa","Block B, Flat 12","08030000001"],
    ["adeola@example.com","Adeola Johnson","Block C, Flat 18","08030000002"],
    ["chinedu@example.com","Chinedu Okafor","House 24","08030000003"],
    ["fatima@example.com","Fatima Bello","Block A, Flat 06","08030000004"]
  ];
  for (const [email, fullName, houseNumber, phone] of residents) {
    const user = await prisma.user.upsert({where:{email},update:{fullName,active:true},create:{email,passwordHash:password,role:Role.RESIDENT,fullName}});
    await prisma.resident.upsert({where:{userId:user.id},update:{houseNumber,phone},create:{userId:user.id,houseNumber,phone}});
  }
  const guardUser = await prisma.user.upsert({where:{email:"guard@example.com"},update:{fullName:"Musa Ibrahim",active:true},create:{email:"guard@example.com",passwordHash:password,role:Role.GUARD,fullName:"Musa Ibrahim"}});
  await prisma.guard.upsert({where:{userId:guardUser.id},update:{assignedGateId:gates[0].id},create:{userId:guardUser.id,assignedGateId:gates[0].id}});
  const guard2 = await prisma.user.upsert({where:{email:"guard2@example.com"},update:{fullName:"Emeka Obi",active:true},create:{email:"guard2@example.com",passwordHash:password,role:Role.GUARD,fullName:"Emeka Obi"}});
  await prisma.guard.upsert({where:{userId:guard2.id},update:{assignedGateId:gates[1].id},create:{userId:guard2.id,assignedGateId:gates[1].id}});
  await prisma.user.upsert({where:{email:"admin@example.com"},update:{fullName:"Estate Administrator",active:true},create:{email:"admin@example.com",passwordHash:password,role:Role.ADMIN,fullName:"Estate Administrator"}});
  const resident = await prisma.resident.findFirst({where:{user:{email:"resident@example.com"}}});
  if (resident) {
    const visitor = await prisma.visitor.upsert({where:{id:"demo-visitor-1"},update:{},create:{id:"demo-visitor-1",fullName:"John Adewale",phone:"08031234567"}}).catch(async()=>prisma.visitor.create({data:{fullName:"John Adewale",phone:"08031234567"}}));
    const existing = await prisma.permit.findFirst({where:{residentId:resident.id,visitorId:visitor.id,purpose:"Personal Visit"}});
    if (!existing) {
      const now = new Date(); const visitDate = new Date(now.getFullYear(),now.getMonth(),now.getDate());
      const raw = crypto.randomBytes(32).toString("hex");
      const permit = await prisma.permit.create({data:{permitNumber:`EST-${visitDate.toISOString().slice(0,10).replaceAll("-","")}-DEMO1`,qrTokenHash:crypto.createHash("sha256").update(raw).digest("hex"),residentId:resident.id,visitorId:visitor.id,purpose:"Personal Visit",visitDate,startTime:"08:00",endTime:"20:00",status:PermitStatus.APPROVED,visit:{create:{status:VisitStatus.EXPECTED}}}});
      console.log("Seeded permit",permit.permitNumber,"QR raw token stored only in development logs; regenerate if needed.");
    }
  }
  await prisma.systemSetting.upsert({where:{key:"retention_days"},update:{value:"60"},create:{key:"retention_days",value:"60"}});
}
main().finally(()=>prisma.$disconnect());
