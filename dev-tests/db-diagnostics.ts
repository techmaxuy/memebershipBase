// dev-tests/db-diagnostic.ts
import 'dotenv/config'
import { Pool } from 'pg'

async function diagnosticDatabase() {
  console.log('🔍 Database Connection Diagnostic (Neon)\n')
  console.log('='.repeat(50))
  
  // 1. Verificar variable de entorno
  const dbUrl = process.env.DATABASE_URL
  console.log('\n1️⃣ Environment Variable:')
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in environment')
    console.log('   Make sure you have a .env file with DATABASE_URL')
    process.exit(1)
  }
  
  // Parsear URL sin mostrar contraseña
  try {
    const url = new URL(dbUrl)
    console.log('✅ DATABASE_URL found:')
    console.log(`   Protocol: ${url.protocol}`)
    console.log(`   Host: ${url.hostname}`)
    console.log(`   Port: ${url.port || '5432'}`)
    console.log(`   Database: ${url.pathname.slice(1)}`)
    console.log(`   User: ${url.username}`)
    console.log(`   Password: ${'*'.repeat(url.password.length)}`)
    console.log(`   SSL: ${url.searchParams.get('sslmode') || 'not specified'}`)
    
    if (url.hostname.includes('neon.tech')) {
      console.log('   ℹ️  Detected Neon database')
    }
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format:', error)
    process.exit(1)
  }

  // 2. Probar conexión con pg y SSL
  console.log('\n2️⃣ Testing PostgreSQL Connection (with SSL):')
  const pool = new Pool({ 
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false // Requerido para Neon
    }
  })
  
  try {
    const client = await pool.connect()
    console.log('✅ Connection successful!')
    
    // 3. Obtener versión de PostgreSQL
    console.log('\n3️⃣ Database Information:')
    const versionResult = await client.query('SELECT version()')
    console.log('✅ PostgreSQL Version:')
    console.log(`   ${versionResult.rows[0].version.split(',')[0]}`)
    
    // 4. Verificar base de datos actual
    const dbResult = await client.query('SELECT current_database()')
    console.log('✅ Current Database:', dbResult.rows[0].current_database)
    
    // 5. Verificar conexión SSL (Neon siempre usa SSL)
    console.log('✅ SSL Active: Yes (required by Neon)')
    
    // 6. Listar tablas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    console.log(`✅ Tables found: ${tablesResult.rows.length}`)
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`)
      })
    } else {
      console.log('   ⚠️  No tables found. Run "npx prisma migrate dev" first.')
    }
    
    client.release()
    console.log('\n' + '='.repeat(50))
    console.log('✨ Diagnostic complete - Neon connection working!\n')
  } catch (error: any) {
    console.error('\n❌ Connection failed:', error.message)
    console.log('\n💡 Common issues with Neon:')
    console.log('   1. SSL not configured (add ssl config to Pool)')
    console.log('   2. Wrong connection string')
    console.log('   3. Database is suspended (wake it up in Neon dashboard)')
    console.log('   4. Network/firewall issues')
    console.log('\n📝 Your DATABASE_URL should end with: ?sslmode=require\n')
    process.exit(1)
  } finally {
    await pool.end()
  }
}

diagnosticDatabase()