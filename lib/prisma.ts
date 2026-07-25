import { config } from 'dotenv'
config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
import { PrismaNeonHttp } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const NEON_DB_URL = 'postgresql://neondb_owner:npg_L2uVz0ipjxkE@ep-frosty-silence-axcqwg5u-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

function getConnectionString(): string {
  const envUrl = (process.env.DATABASE_URL || process.env['DATABASE_URL'] || '').trim()
  if (envUrl && envUrl.startsWith('postgres')) {
    return envUrl
  }
  return NEON_DB_URL
}

function createPrismaClient() {
  const connectionString = getConnectionString()
  const adapter = new PrismaNeonHttp(connectionString, {})
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

