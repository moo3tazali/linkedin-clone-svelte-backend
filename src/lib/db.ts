import { PrismaClient } from '@prisma/client';
import { dev } from '$app/environment';
declare global {
	var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma || new PrismaClient();

if (dev) globalThis.prisma = db;
