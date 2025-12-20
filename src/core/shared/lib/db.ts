
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined")
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const pool = new Pool({ connectionString,
    // Neon requiere SSL
  ssl: {
    rejectUnauthorized: false
  },
  // Configuración recomendada para Neon
  max: 10, // Máximo de conexiones
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, })
const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'], })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Manejo de cierre limpio
process.on('beforeExit', async () => {
  await pool.end()
})
