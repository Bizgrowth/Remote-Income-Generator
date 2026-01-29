import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Validate DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL: DATABASE_URL environment variable is required in production');
  }
  console.warn('WARNING: DATABASE_URL not set. Database operations will fail.');
}

// Prevent multiple instances during hot reload in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7 requires adapter for direct database connection
const pool = new Pool({ connectionString: databaseUrl || 'postgresql://localhost:5432/placeholder' });
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
