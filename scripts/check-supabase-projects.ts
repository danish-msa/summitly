/**
 * Check Supabase Projects and Image URLs
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

const projectNames = [
  '2 Post Road',
  'Above Condos',
  'Freed Hotel & Residences',
  'Glen Abbey Encore By Fernbrook',
  'Ivy Rouge By Rosehaven',
  'Ivy Rouge By Starlane Homes',
  'Joshua Creek Montage By Hallett',
  'Lily at Crosstown Condos',
  'LSQ 1 & 2',
  'M6 Condos',
  'Mari at Williamsburg',
  'Nava Oakville',
  'Oakbrook Towns',
  'Southport in Swansea',
  'Textbook Towns',
  'The Aston Residences',
]

async function main() {
  console.log('🔍 Checking Supabase Projects and Image URLs\n')

  for (const projectName of projectNames) {
    const projects = await prisma.preConstructionProject.findMany({
      where: {
        projectName: {
          contains: projectName,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        mlsNumber: true,
        projectName: true,
        images: true,
        isPublished: true,
      },
    })

    if (projects.length === 0) {
      console.log(`❌ "${projectName}" - NOT FOUND`)
      continue
    }

    for (const project of projects) {
      console.log(`\n📦 ${project.projectName} (${project.mlsNumber})`)
      console.log(`   Published: ${project.isPublished}`)
      console.log(`   Images: ${project.images.length}`)

      if (project.images.length === 0) {
        console.log(`   ❌ NO IMAGES`)
      } else {
        project.images.forEach((url, index) => {
          const urlType = url.includes('supabase.co') 
            ? 'Supabase' 
            : url.includes('shared-s3.property.ca') 
            ? 'AWS S3' 
            : 'Other'
          console.log(`   Image ${index + 1} (${urlType}): ${url.substring(0, 100)}...`)
        })
      }
    }
  }

  await prisma.$disconnect()
  await pool.end()
}

main()

