// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/core/shared/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Test 1: Conexión básica
    await prisma.$connect()
    
    // Test 2: Query simple
    await prisma.$queryRaw`SELECT 1 as result`
    
    // Test 3: Contar tablas
    const tables: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      tables: parseInt(tables[0].count),
      environment: process.env.NODE_ENV,
      region: process.env.VERCEL_REGION || 'unknown'
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV
    }, { status: 503 })
  } finally {
    await prisma.$disconnect()
  }
}