import { PrismaClient } from '@prisma/client';

// one shared database connection for the whole app
export const prisma = new PrismaClient();
