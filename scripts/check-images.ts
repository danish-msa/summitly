/**
 * Check image URLs in database
 */

import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

let cleanConnectionString = connectionString
try {
  const url = new URL(connectionString)
  url.searchParams.delete('sslmode')
  url.searchParams.delete('sslrootcert')
  url.searchParams.delete('sslcert')
  url.searchParams.delete('sslkey')
  cleanConnectionString = url.toString()
} catch (error) {
  console.warn('Failed to parse DATABASE_URL, using original string', error)
}

const pool = new Pool({
  connectionString: cleanConnectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🔍 Checking project images in database...\n')

  const projects = await prisma.preConstructionProject.findMany({
    where: { isPublished: true },
    select: {
      mlsNumber: true,
      projectName: true,
      images: true,
    },
    take: 20,
  })

  console.log(`Found ${projects.length} published projects\n`)

  let withImages = 0
  let withoutImages = 0
  let supabaseUrls = 0
  let awsUrls = 0
  let otherUrls = 0

  for (const project of projects) {
    if (project.images.length === 0) {
      withoutImages++
      console.log(`❌ ${project.mlsNumber}: ${project.projectName} - NO IMAGES`)
    } else {
      withImages++
      const firstImage = project.images[0]
      if (firstImage.includes('supabase.co')) {
        supabaseUrls++
        console.log(`⚠️  ${project.mlsNumber}: ${project.projectName}`)
        console.log(`   Supabase URL: ${firstImage.substring(0, 100)}...`)
      } else if (firstImage.includes('shared-s3.property.ca')) {
        awsUrls++
        console.log(`✅ ${project.mlsNumber}: ${project.projectName} - AWS URL`)
      } else {
        otherUrls++
        console.log(`❓ ${project.mlsNumber}: ${project.projectName}`)
        console.log(`   Other URL: ${firstImage.substring(0, 100)}...`)
      }
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`  Projects with images: ${withImages}`)
  console.log(`  Projects without images: ${withoutImages}`)
  console.log(`  Supabase URLs: ${supabaseUrls}`)
  console.log(`  AWS URLs: ${awsUrls}`)
  console.log(`  Other URLs: ${otherUrls}`)

  await prisma.$disconnect()
  await pool.end()
}

main()

