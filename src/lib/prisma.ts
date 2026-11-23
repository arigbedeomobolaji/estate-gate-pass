import { PrismaClient } from '@prisma/client';
declare global { var __estatePrisma: PrismaClient | undefined }
export const prisma = global.__estatePrisma || new PrismaClient();
if(process.env.NODE_ENV!=='production') global.__estatePrisma=prisma;
