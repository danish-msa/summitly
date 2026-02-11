/**
 * Retry Failed Image Migration
 * 
 * This script retries downloading and uploading images that failed during migration.
 * 
 * Usage:
 *   npx tsx scripts/retry-failed-images.ts
 */

import { PrismaClient } from '@prisma/client'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Configuration
const AWS_PUBLIC_URL = 'https://shared-s3.property.ca/public'
const AWS_BUCKET = process.env.S3_BUCKET || 'summitly-storage'
const AWS_REGION = process.env.S3_REGION || 'ca-central-1'

// Initialize Prisma client
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables')
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
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 20000,
  allowExitOnIdle: false,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
})

// Failed images from the migration
const failedUrls = [
  'https://omsefyactufffyqaxowx.supabase.co/storage/v1/object/public/images/pre-con/projects/1764620007676-k9vlb1nw4oe.webp',
  'https://omsefyactufffyqaxowx.supabase.co/storage/v1/object/public/images/pre-con/projects/1764623887323-yyozbbe4ch.webp',
  'https://omsefyactufffyqaxowx.supabase.co/storage/v1/object/public/images/pre-con/projects/1764623890942-42od98026ok.webp',
  'https://omsefyactufffyqaxowx.supabase.co/storage/v1/object/public/images/pre-con/projects/1764689254333-2ol9ziki85e.jpeg',
  'https://omsefyactufffyqaxowx.supabase.co/storage/v1/object/public/images/pre-con/projects/1764623894264-dhdpn3mxem.webp',
  'https://omsefyactufffyqaxowx.supabase.co/storage/v1/object/public/images/pre-con/projects/1764623881660-mr0bgpr2vws.jpg',
]

function extractSupabasePath(url: string): { bucket: string; filePath: string } | null {
  const match = url.match(/\/storage\/v1\/object\/public\/(images|documents)\/(.+)$/)
  if (!match) return null
  
  const [, bucket, filePath] = match
  return { bucket, filePath }
}

function getAwsUrl(supabaseUrl: string): string {
  const pathInfo = extractSupabasePath(supabaseUrl)
  if (!pathInfo) return supabaseUrl
  
  const { bucket, filePath } = pathInfo
  return `${AWS_PUBLIC_URL}/${bucket}/${filePath}`
}

function getContentType(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase()
  const types: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
  }
  return types[ext || ''] || 'application/octet-stream'
}

async function retryImage(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`\n🔄 Retrying: ${url.split('/').pop()}`)
    
    // Try downloading with retry
    let buffer: Buffer
    let retries = 3
    while (retries > 0) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(30000), // 30 second timeout
        })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        buffer = Buffer.from(arrayBuffer)
        break
      } catch (error) {
        retries--
        if (retries === 0) throw error
        console.log(`  ⚠️  Retry attempt ${4 - retries}/3...`)
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
      }
    }

    const pathInfo = extractSupabasePath(url)
    if (!pathInfo) {
      return { success: false, error: 'Invalid URL format' }
    }

    const { bucket, filePath } = pathInfo
    const contentType = getContentType(url)

    // Check if already in S3
    try {
      await s3Client.send(new HeadObjectCommand({
        Bucket: AWS_BUCKET,
        Key: `${bucket}/${filePath}`,
      }))
      console.log(`  ✓ Already exists in S3, skipping upload`)
    } catch (error: any) {
      if (error.name === 'NotFound') {
        // Upload to S3
        await s3Client.send(new PutObjectCommand({
          Bucket: AWS_BUCKET,
          Key: `${bucket}/${filePath}`,
          Body: buffer!,
          ContentType: contentType,
          ACL: 'public-read',
        }))
        console.log(`  ✅ Uploaded to S3`)
      } else {
        throw error
      }
    }

    return { success: true }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.log(`  ❌ Failed: ${errorMsg}`)
    return { success: false, error: errorMsg }
  }
}

async function main() {
  console.log('🔄 Retrying Failed Image Downloads\n')
  console.log(`Found ${failedUrls.length} failed images to retry\n`)

  let successCount = 0
  let failCount = 0

  for (const url of failedUrls) {
    const result = await retryImage(url)
    if (result.success) {
      successCount++
    } else {
      failCount++
    }
  }

  console.log(`\n📊 Retry Results:`)
  console.log(`  ✅ Success: ${successCount}`)
  console.log(`  ❌ Failed: ${failCount}`)

  if (failCount > 0) {
    console.log(`\n⚠️  Some images could not be downloaded.`)
    console.log(`   They may have been deleted from Supabase Storage.`)
    console.log(`   You may need to manually replace these images or remove the URLs from your database.`)
  }

  await prisma.$disconnect()
  await pool.end()
}

main()

