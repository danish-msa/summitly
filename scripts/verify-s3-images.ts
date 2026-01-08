/**
 * Verify S3 Image Accessibility
 * 
 * This script checks if images in the database actually exist and are accessible in S3
 */

import { PrismaClient } from '@prisma/client'
import { S3Client, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
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

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ca-central-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.S3_BUCKET || 'summitly-storage'

function extractS3Path(url: string): string | null {
  // Extract path from https://shared-s3.property.ca/public/images/...
  const match = url.match(/https:\/\/shared-s3\.property\.ca\/public\/(.+)$/)
  if (match) {
    return match[1]
  }
  
  // Also handle s3.amazonaws.com URLs
  const s3Match = url.match(/https:\/\/[^/]+\.s3\.[^/]+\/(.+)$/)
  if (s3Match) {
    return s3Match[1]
  }
  
  return null
}

async function checkImageExists(s3Path: string): Promise<boolean> {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Path,
    }))
    return true
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false
    }
    throw error
  }
}

async function testImageAccessibility(url: string): Promise<{ exists: boolean; accessible: boolean; error?: string }> {
  const s3Path = extractS3Path(url)
  if (!s3Path) {
    return { exists: false, accessible: false, error: 'Invalid URL format' }
  }

  // Check if exists in S3
  const exists = await checkImageExists(s3Path)

  if (!exists) {
    return { exists: false, accessible: false, error: 'File not found in S3' }
  }

  // Test HTTP accessibility
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return {
      exists: true,
      accessible: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    }
  } catch (error) {
    return {
      exists: true,
      accessible: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

async function listS3Prefixes(): Promise<string[]> {
  const prefixes = new Set<string>()
  
  try {
    let continuationToken: string | undefined
    
    do {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Delimiter: '/',
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      })
      
      const response = await s3Client.send(command)
      
      if (response.CommonPrefixes) {
        for (const prefix of response.CommonPrefixes) {
          if (prefix.Prefix) {
            prefixes.add(prefix.Prefix)
          }
        }
      }
      
      continuationToken = response.NextContinuationToken
    } while (continuationToken)
  } catch (error) {
    console.error('Error listing S3 prefixes:', error)
  }
  
  return Array.from(prefixes).sort()
}

async function main() {
  console.log('🔍 Verifying S3 Image Accessibility\n')

  // First, list S3 structure
  console.log('📁 Checking S3 bucket structure...')
  const prefixes = await listS3Prefixes()
  console.log(`Found ${prefixes.length} prefixes in S3:`)
  prefixes.forEach(p => console.log(`  - ${p}`))
  console.log('')

  // Get sample projects
  const projects = await prisma.preConstructionProject.findMany({
    where: { isPublished: true },
    select: {
      mlsNumber: true,
      projectName: true,
      images: true,
    },
    take: 10,
  })

  console.log(`\n🔍 Checking ${projects.length} sample projects...\n`)

  let totalImages = 0
  let existingImages = 0
  let accessibleImages = 0
  let missingImages = 0
  let inaccessibleImages = 0

  for (const project of projects) {
    if (project.images.length === 0) {
      console.log(`❌ ${project.mlsNumber}: ${project.projectName} - NO IMAGES`)
      continue
    }

    console.log(`\n📦 ${project.mlsNumber}: ${project.projectName}`)
    console.log(`   Images: ${project.images.length}`)

    for (let i = 0; i < Math.min(project.images.length, 3); i++) {
      const imageUrl = project.images[i]
      totalImages++

      const s3Path = extractS3Path(imageUrl)
      console.log(`   Image ${i + 1}: ${s3Path ? s3Path.substring(0, 80) + '...' : 'INVALID URL'}`)

      const result = await testImageAccessibility(imageUrl)
      
      if (!result.exists) {
        missingImages++
        console.log(`     ❌ NOT FOUND IN S3`)
      } else if (!result.accessible) {
        inaccessibleImages++
        console.log(`     ⚠️  EXISTS BUT NOT ACCESSIBLE: ${result.error}`)
      } else {
        accessibleImages++
        existingImages++
        console.log(`     ✅ EXISTS AND ACCESSIBLE`)
      }
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`  Total images checked: ${totalImages}`)
  console.log(`  ✅ Existing in S3: ${existingImages}`)
  console.log(`  ✅ Accessible via HTTP: ${accessibleImages}`)
  console.log(`  ❌ Missing from S3: ${missingImages}`)
  console.log(`  ⚠️  Exists but not accessible: ${inaccessibleImages}`)

  if (missingImages > 0 || inaccessibleImages > 0) {
    console.log(`\n⚠️  Issues found!`)
    console.log(`   - Missing images may need to be re-uploaded`)
    console.log(`   - Inaccessible images may have CORS or public access issues`)
    console.log(`   - Check S3 bucket permissions and CORS configuration`)
  }

  await prisma.$disconnect()
  await pool.end()
}

main()

