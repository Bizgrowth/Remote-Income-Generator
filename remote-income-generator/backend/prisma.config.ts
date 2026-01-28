import { defineConfig } from "prisma/config";

// DATABASE_URL may not be available during build (prisma generate)
// but is required at runtime (prisma migrate deploy)
const databaseUrl = process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
