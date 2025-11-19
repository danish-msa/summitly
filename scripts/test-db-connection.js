/**
 * Database Connection Test Script
 * Run this to verify your DATABASE_URL is correct
 * 
 * Usage: node scripts/test-db-connection.js
 */

const { PrismaClient } = require('@prisma/client')

async function testConnection() {
  console.log('🔍 Testing database connection...\n')
  
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set')
    console.log('\n📝 Please set DATABASE_URL in your .env.local file')
    process.exit(1)
  }
  
  // Mask password in output
  const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@')
  console.log(`📍 Connection String: ${maskedUrl}\n`)
  
  // Check connection type
  if (databaseUrl.includes('pooler.supabase.com') || databaseUrl.includes(':6543')) {
    console.log('🔗 Connection Type: POOLER (port 6543)')
    if (!databaseUrl.includes('pgbouncer=true')) {
      console.warn('⚠️  WARNING: Missing ?pgbouncer=true parameter')
      console.log('   Add ?pgbouncer=true to disable prepared statements\n')
    }
  } else if (databaseUrl.includes(':5432') || databaseUrl.includes('db.')) {
    console.log('🔗 Connection Type: DIRECT (port 5432)')
    if (!databaseUrl.includes('sslmode=')) {
      console.warn('⚠️  WARNING: Missing ?sslmode=require parameter')
      console.log('   Add ?sslmode=require for SSL connection\n')
    }
  }
  
  const prisma = new PrismaClient({
    log: ['error'],
  })
  
  try {
    console.log('🔄 Attempting to connect...\n')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Successfully connected to database!\n')
    
    // Test a simple query
    const userCount = await prisma.user.count()
    console.log(`📊 Database is accessible`)
    console.log(`   Users in database: ${userCount}\n`)
    
    // Test query performance
    const start = Date.now()
    await prisma.user.findMany({ take: 1 })
    const duration = Date.now() - start
    console.log(`⚡ Query performance: ${duration}ms\n`)
    
    console.log('✅ All tests passed! Your database connection is working correctly.\n')
    
  } catch (error) {
    console.error('❌ Connection failed!\n')
    console.error('Error details:')
    console.error(error.message)
    console.error('\n')
    
    if (error.message.includes("Can't reach database server")) {
      console.log('💡 Troubleshooting steps:')
      console.log('   1. Check if your Supabase project is ACTIVE (not paused)')
      console.log('   2. Verify the connection string in Supabase dashboard')
      console.log('   3. Try using DIRECT connection (port 5432) instead of pooler')
      console.log('   4. Check your network/firewall settings')
      console.log('   5. Ensure SSL is enabled: ?sslmode=require\n')
    } else if (error.message.includes('prepared statement')) {
      console.log('💡 Solution: Add ?pgbouncer=true to your connection string\n')
    } else if (error.message.includes('SSL')) {
      console.log('💡 Solution: Add ?sslmode=require to your connection string\n')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()

