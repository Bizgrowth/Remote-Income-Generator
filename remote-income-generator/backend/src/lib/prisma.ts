import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Validate DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;
console.log('DATABASE_URL exists:', !!databaseUrl);
console.log('DATABASE_URL host:', databaseUrl ? new URL(databaseUrl).host : 'N/A');
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
// Render PostgreSQL requires SSL in production
const pool = new Pool({
  connectionString: databaseUrl || 'postgresql://localhost:5432/placeholder',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
const adapter = new PrismaPg(pool);

// Test connection on startup
pool.query('SELECT 1').then(() => {
  console.log('PostgreSQL pool connected successfully');
}).catch((err: Error) => {
  console.error('PostgreSQL pool connection error:', err.message);
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
