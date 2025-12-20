// dev-tests/db-connection-full.test.ts
//import 'dotenv/config'
import { prisma } from '../src/core/shared/lib/db'

interface TestResult {
  name: string
  status: 'passed' | 'failed'
  message?: string
  duration?: number
}

async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<TestResult> {
  const start = Date.now()
  try {
    await testFn()
    return {
      name,
      status: 'passed',
      duration: Date.now() - start
    }
  } catch (error) {
    return {
      name,
      status: 'failed',
      message: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start
    }
  }
}

async function testDatabaseConnection() {
  console.log('🔍 Running Database Connection Tests\n')
  console.log('='.repeat(50))
  
  const results: TestResult[] = []

  // Test 1: Conexión básica
  results.push(await runTest('Basic Connection', async () => {
    await prisma.$connect()
  }))

  // Test 2: Query simple
  results.push(await runTest('Simple Query', async () => {
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`
    if (!result) throw new Error('Query returned no results')
  }))

  // Test 3: Verificar tablas
  results.push(await runTest('Check Tables', async () => {
    const tables: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    console.log(`   📋 Found ${tables.length} tables:`, tables.map(t => t.table_name).join(', '))
  }))

  // Test 4: Verificar modelos Prisma (ejemplo genérico)
  results.push(await runTest('Prisma Models Access', async () => {
    // Intenta acceder a los modelos definidos en tu schema
    // Ajusta según tus modelos reales
    const modelNames = Object.keys(prisma).filter(key => 
      !key.startsWith('$') && !key.startsWith('_')
    )
    console.log(`   🎯 Available models:`, modelNames.join(', '))
    
    if (modelNames.length === 0) {
      throw new Error('No Prisma models found. Run "npx prisma generate"')
    }
  }))

  // Test 5: Transacción
  results.push(await runTest('Transaction Support', async () => {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1`
    })
  }))

  // Test 6: Pool de conexiones
  results.push(await runTest('Connection Pool', async () => {
    const promises = Array.from({ length: 5 }, (_, i) => 
      prisma.$queryRaw`SELECT ${i} as num`
    )
    await Promise.all(promises)
  }))

  // Imprimir resultados
  console.log('\n' + '='.repeat(50))
  console.log('📊 Test Results:\n')
  
  results.forEach(result => {
    const icon = result.status === 'passed' ? '✅' : '❌'
    const duration = result.duration ? ` (${result.duration}ms)` : ''
    console.log(`${icon} ${result.name}${duration}`)
    if (result.message) {
      console.log(`   ⚠️  ${result.message}`)
    }
  })

  const passed = results.filter(r => r.status === 'passed').length
  const failed = results.filter(r => r.status === 'failed').length

  console.log('\n' + '='.repeat(50))
  console.log(`\n📈 Summary: ${passed} passed, ${failed} failed`)

  await prisma.$disconnect()
  console.log('🔌 Database disconnected\n')

  if (failed > 0) {
    process.exit(1)
  }

  console.log('✨ All tests passed!\n')
}

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled error:', error)
  prisma.$disconnect()
  process.exit(1)
})

testDatabaseConnection()