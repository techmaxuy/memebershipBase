// app/api/health/detailed/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/core/shared/lib/db'

export const dynamic = 'force-dynamic'

interface HealthCheck {
  name: string
  status: 'pass' | 'fail'
  responseTime?: number
  error?: string
  details?: any
}

export async function GET(request: Request) {
  // Verificar si hay un secret token (opcional, para seguridad)
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const expectedToken = process.env.HEALTH_CHECK_TOKEN
  
  if (expectedToken && token !== expectedToken) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const startTime = Date.now()
  const checks: HealthCheck[] = []

  // Check 1: Conexión a la base de datos
  const dbConnectionStart = Date.now()
  try {
    await prisma.$connect()
    checks.push({
      name: 'database_connection',
      status: 'pass',
      responseTime: Date.now() - dbConnectionStart
    })
  } catch (error) {
    checks.push({
      name: 'database_connection',
      status: 'fail',
      responseTime: Date.now() - dbConnectionStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Check 2: Query básico
  const queryStart = Date.now()
  try {
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`
    checks.push({
      name: 'database_query',
      status: 'pass',
      responseTime: Date.now() - queryStart,
      details: result
    })
  } catch (error) {
    checks.push({
      name: 'database_query',
      status: 'fail',
      responseTime: Date.now() - queryStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Check 3: Tablas en la base de datos
  try {
    const tables: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    checks.push({
      name: 'database_tables',
      status: 'pass',
      details: {
        count: tables.length,
        tables: tables.map(t => t.table_name)
      }
    })
  } catch (error) {
    checks.push({
      name: 'database_tables',
      status: 'fail',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Check 4: Modelos de Prisma
  try {
    const modelNames = Object.keys(prisma).filter(key => 
      !key.startsWith('$') && !key.startsWith('_')
    )
    checks.push({
      name: 'prisma_models',
      status: 'pass',
      details: {
        count: modelNames.length,
        models: modelNames
      }
    })
  } catch (error) {
    checks.push({
      name: 'prisma_models',
      status: 'fail',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  await prisma.$disconnect()

  const totalResponseTime = Date.now() - startTime
  const allPassed = checks.every(check => check.status === 'pass')

  return NextResponse.json({
    status: allPassed ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    totalResponseTime: `${totalResponseTime}ms`,
    checks,
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      vercelRegion: process.env.VERCEL_REGION,
      nodeVersion: process.version
    }
  }, { 
    status: allPassed ? 200 : 503 
  })
}