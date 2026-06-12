import { PrismaClient } from "@/generated/prisma";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const poolConfig = {
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000, // close idle connections after 30s of inactivity
  connectionTimeoutMillis: 2000,
  keepAlive: true,
};

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  const pool = new Pool(poolConfig);
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool(poolConfig);
    globalForPrisma.pool.on("error", (err) => {
      console.error("Unexpected error on idle database client:", err);
    });
  }
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg(globalForPrisma.pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalForPrisma.prisma;
}

export { prisma };