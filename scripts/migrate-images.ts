/**
 * Image Migration Script: Supabase Storage → AWS S3
 * 
 * This script:
 * 1. Finds all Supabase image URLs in the database
 * 2. Downloads images from Supabase Storage
 * 3. Uploads images to AWS S3
 * 4. Updates database URLs from Supabase to AWS
 * 
 * Usage:
 *   npx tsx scripts/migrate-images.ts [--dry-run] [--limit=N]
 * 
 * Options:
 *   --dry-run: Only identify URLs, don't download/upload/update
 *   --limit=N: Process only first N images (for testing)
 */

import { PrismaClient } from '@prisma/client'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'

// Configuration
const SUPABASE_BASE_URL = 'https://omsefyactufffyqaxowx.supabase.co/storage/v1/object/public'
const AWS_PUBLIC_URL = 'https://shared-s3.property.ca/public'
const AWS_BUCKET = process.env.AWS_S3_BUCKET || 'summitly-storage'
const AWS_REGION = process.env.AWS_REGION || 'ca-central-1'
const DOWNLOAD_DIR = path.join(process.cwd(), '.migration-temp')
const MAX_CONCURRENT = 5 // Number of concurrent downloads/uploads

// Initialize Prisma client (same as src/lib/prisma.ts)
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables')
}

// Clean connection string for pg driver
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
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

// Types
interface ImageUrl {
  table: string
  id: string
  field: string
  url: string
  newUrl?: string
}

interface MigrationResult {
  total: number
  downloaded: number
  uploaded: number
  updated: number
  failed: number
  skipped: number
  errors: Array<{ url: string; error: string }>
}

// Utility functions
function isSupabaseUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return url.includes('supabase.co/storage/v1/object/public')
}

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

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function uploadToS3(filePath: string, buffer: Buffer, contentType: string): Promise<void> {
  // Check if file already exists in S3
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: AWS_BUCKET,
      Key: filePath,
    }))
    // File exists, skip upload
    return
  } catch (error: any) {
    if (error.name !== 'NotFound') {
      throw error
    }
    // File doesn't exist, proceed with upload
  }

  await s3Client.send(new PutObjectCommand({
    Bucket: AWS_BUCKET,
    Key: filePath,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  }))
}

function getContentType(url: string): string {
  const ext = path.extname(url).toLowerCase()
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
  }
  return types[ext] || 'application/octet-stream'
}

// Find all Supabase URLs in database
async function findSupabaseUrls(): Promise<ImageUrl[]> {
  const urls: ImageUrl[] = []

  console.log('🔍 Scanning database for Supabase URLs...\n')

  // 1. Property.images (String[])
  const properties = await prisma.property.findMany({
    select: { id: true, images: true },
  })
  for (const prop of properties) {
    for (const imageUrl of prop.images) {
      if (isSupabaseUrl(imageUrl)) {
        urls.push({
          table: 'Property',
          id: prop.id,
          field: 'images',
          url: imageUrl,
        })
      }
    }
  }

  // 2. PreConstructionProject.images (String[])
  const projects = await prisma.preConstructionProject.findMany({
    select: { id: true, images: true },
  })
  for (const project of projects) {
    for (const imageUrl of project.images) {
      if (isSupabaseUrl(imageUrl)) {
        urls.push({
          table: 'PreConstructionProject',
          id: project.id,
          field: 'images',
          url: imageUrl,
        })
      }
    }
  }

  // 3. PreConstructionUnit.images (String[])
  const units = await prisma.preConstructionUnit.findMany({
    select: { id: true, images: true },
  })
  for (const unit of units) {
    for (const imageUrl of unit.images) {
      if (isSupabaseUrl(imageUrl)) {
        urls.push({
          table: 'PreConstructionUnit',
          id: unit.id,
          field: 'images',
          url: imageUrl,
        })
      }
    }
  }

  // 4. PreConstructionPageContent.heroImage (String)
  const pages = await prisma.preConstructionPageContent.findMany({
    select: { id: true, heroImage: true },
  })
  for (const page of pages) {
    if (isSupabaseUrl(page.heroImage)) {
      urls.push({
        table: 'PreConstructionPageContent',
        id: page.id,
        field: 'heroImage',
        url: page.heroImage!,
      })
    }
  }

  // 5. DevelopmentTeam.image (String)
  const teams = await prisma.developmentTeam.findMany({
    select: { id: true, image: true },
  })
  for (const team of teams) {
    if (isSupabaseUrl(team.image)) {
      urls.push({
        table: 'DevelopmentTeam',
        id: team.id,
        field: 'image',
        url: team.image!,
      })
    }
  }

  // 6. User.image (String)
  const users = await prisma.user.findMany({
    select: { id: true, image: true },
  })
  for (const user of users) {
    if (isSupabaseUrl(user.image)) {
      urls.push({
        table: 'User',
        id: user.id,
        field: 'image',
        url: user.image!,
      })
    }
  }

  // 7. PreConstructionProject JSON fields (developerInfo, architectInfo, etc.)
  const projectsWithJson = await prisma.preConstructionProject.findMany({
    select: {
      id: true,
      developerInfo: true,
      architectInfo: true,
      builderInfo: true,
      interiorDesignerInfo: true,
      landscapeArchitectInfo: true,
      marketingInfo: true,
    },
  })

  for (const project of projectsWithJson) {
    const jsonFields = [
      { name: 'developerInfo', value: project.developerInfo },
      { name: 'architectInfo', value: project.architectInfo },
      { name: 'builderInfo', value: project.builderInfo },
      { name: 'interiorDesignerInfo', value: project.interiorDesignerInfo },
      { name: 'landscapeArchitectInfo', value: project.landscapeArchitectInfo },
      { name: 'marketingInfo', value: project.marketingInfo },
    ]

    for (const field of jsonFields) {
      if (!field.value) continue
      
      try {
        const json = typeof field.value === 'string' ? JSON.parse(field.value) : field.value
        if (json && typeof json === 'object' && json.image && isSupabaseUrl(json.image)) {
          urls.push({
            table: 'PreConstructionProject',
            id: project.id,
            field: field.name,
            url: json.image,
          })
        }
      } catch (e) {
        // Not valid JSON, skip
      }
    }
  }

  // Remove duplicates (same URL)
  const uniqueUrls = new Map<string, ImageUrl>()
  for (const item of urls) {
    if (!uniqueUrls.has(item.url)) {
      uniqueUrls.set(item.url, item)
    }
  }

  return Array.from(uniqueUrls.values())
}

// Process a single image
async function processImage(
  imageUrl: ImageUrl,
  dryRun: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const pathInfo = extractSupabasePath(imageUrl.url)
    if (!pathInfo) {
      return { success: false, error: 'Invalid Supabase URL format' }
    }

    const { bucket, filePath } = pathInfo
    const newUrl = getAwsUrl(imageUrl.url)

    if (dryRun) {
      console.log(`  ✓ Would migrate: ${path.basename(filePath)}`)
      return { success: true }
    }

    // Download from Supabase
    const buffer = await downloadImage(imageUrl.url)
    const contentType = getContentType(imageUrl.url)

    // Upload to S3
    await uploadToS3(`${bucket}/${filePath}`, buffer, contentType)

    imageUrl.newUrl = newUrl
    return { success: true }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMsg }
  }
}

// Process images with concurrency control
async function processImages(
  images: ImageUrl[],
  dryRun: boolean,
  limit?: number
): Promise<MigrationResult> {
  const result: MigrationResult = {
    total: images.length,
    downloaded: 0,
    uploaded: 0,
    updated: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  }

  const toProcess = limit ? images.slice(0, limit) : images
  const processed = new Set<string>() // Track processed URLs to avoid duplicates

  console.log(`\n📦 Processing ${toProcess.length} unique images...\n`)

  // Process in batches
  for (let i = 0; i < toProcess.length; i += MAX_CONCURRENT) {
    const batch = toProcess.slice(i, i + MAX_CONCURRENT)
    const batchResults = await Promise.all(
      batch.map(async (imageUrl) => {
        // Skip if already processed
        if (processed.has(imageUrl.url)) {
          result.skipped++
          return { success: true }
        }
        processed.add(imageUrl.url)

        const processResult = await processImage(imageUrl, dryRun)
        if (processResult.success) {
          result.downloaded++
          result.uploaded++
        } else {
          result.failed++
          result.errors.push({
            url: imageUrl.url,
            error: processResult.error || 'Unknown error',
          })
        }
        return processResult
      })
    )

    // Progress update
    const processedCount = Math.min(i + MAX_CONCURRENT, toProcess.length)
    console.log(`  Progress: ${processedCount}/${toProcess.length} images processed`)
  }

  return result
}

// Update database URLs
async function updateDatabaseUrls(images: ImageUrl[], dryRun: boolean): Promise<number> {
  if (dryRun) {
    console.log('\n📝 Would update database URLs (dry-run mode)')
    return 0
  }

  console.log('\n📝 Updating database URLs...\n')

  let updated = 0

  // Group by table and field
  const grouped = new Map<string, ImageUrl[]>()
  for (const img of images) {
    if (!img.newUrl) continue
    const key = `${img.table}.${img.field}`
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(img)
  }

  // Update each group
  for (const [key, group] of grouped) {
    const [table, field] = key.split('.')

    if (field === 'images') {
      // Array field - need to update each record individually
      for (const img of group) {
        try {
          if (table === 'Property') {
            const record = await prisma.property.findUnique({
              where: { id: img.id },
              select: { images: true },
            })
            if (record) {
              const updatedImages = record.images.map((url) =>
                url === img.url ? img.newUrl! : url
              )
              await prisma.property.update({
                where: { id: img.id },
                data: { images: updatedImages },
              })
              updated++
            }
          } else if (table === 'PreConstructionProject') {
            const record = await prisma.preConstructionProject.findUnique({
              where: { id: img.id },
              select: { images: true },
            })
            if (record) {
              const updatedImages = record.images.map((url) =>
                url === img.url ? img.newUrl! : url
              )
              await prisma.preConstructionProject.update({
                where: { id: img.id },
                data: { images: updatedImages },
              })
              updated++
            }
          } else if (table === 'PreConstructionUnit') {
            const record = await prisma.preConstructionUnit.findUnique({
              where: { id: img.id },
              select: { images: true },
            })
            if (record) {
              const updatedImages = record.images.map((url) =>
                url === img.url ? img.newUrl! : url
              )
              await prisma.preConstructionUnit.update({
                where: { id: img.id },
                data: { images: updatedImages },
              })
              updated++
            }
          }
        } catch (error) {
          console.error(`  ✗ Failed to update ${table}.${img.id}:`, error)
        }
      }
    } else if (field === 'heroImage') {
      // Single string field
      for (const img of group) {
        try {
          await prisma.preConstructionPageContent.update({
            where: { id: img.id },
            data: { heroImage: img.newUrl! },
          })
          updated++
        } catch (error) {
          console.error(`  ✗ Failed to update ${table}.${img.id}:`, error)
        }
      }
    } else if (field === 'image') {
      // Single string field
      for (const img of group) {
        try {
          if (table === 'DevelopmentTeam') {
            await prisma.developmentTeam.update({
              where: { id: img.id },
              data: { image: img.newUrl! },
            })
            updated++
          } else if (table === 'User') {
            await prisma.user.update({
              where: { id: img.id },
              data: { image: img.newUrl! },
            })
            updated++
          }
        } catch (error) {
          console.error(`  ✗ Failed to update ${table}.${img.id}:`, error)
        }
      }
    } else {
      // JSON fields (developerInfo, architectInfo, etc.)
      for (const img of group) {
        try {
          const record = await prisma.preConstructionProject.findUnique({
            where: { id: img.id },
            select: { [field]: true } as any,
          })

          if (record && (record as any)[field]) {
            const jsonValue = typeof (record as any)[field] === 'string'
              ? JSON.parse((record as any)[field])
              : (record as any)[field]

            if (jsonValue && typeof jsonValue === 'object' && jsonValue.image) {
              jsonValue.image = img.newUrl!
              // JSON fields are stored as strings in Prisma, so we need to stringify
              await prisma.preConstructionProject.update({
                where: { id: img.id },
                data: { 
                  [field]: JSON.stringify(jsonValue)
                } as any,
              })
              updated++
            }
          }
        } catch (error) {
          console.error(`  ✗ Failed to update ${table}.${img.id}.${field}:`, error)
        }
      }
    }
  }

  return updated
}

// Main function
async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const limitMatch = args.find((arg) => arg.startsWith('--limit='))
  const limit = limitMatch ? parseInt(limitMatch.split('=')[1]) : undefined

  console.log('🚀 Image Migration Script: Supabase → AWS S3\n')
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (will update database)'}`)
  if (limit) {
    console.log(`Limit: Processing first ${limit} images only`)
  }
  console.log('')

  try {
    // Step 1: Find all Supabase URLs
    const images = await findSupabaseUrls()
    console.log(`\n✅ Found ${images.length} unique Supabase image URLs\n`)

    if (images.length === 0) {
      console.log('✨ No Supabase URLs found. Migration complete!')
      return
    }

    // Show breakdown by table
    const byTable = new Map<string, number>()
    for (const img of images) {
      byTable.set(img.table, (byTable.get(img.table) || 0) + 1)
    }
    console.log('Breakdown by table:')
    for (const [table, count] of byTable) {
      console.log(`  - ${table}: ${count} images`)
    }

    // Step 2: Process images (download & upload)
    const processResult = await processImages(images, dryRun, limit)
    console.log('\n📊 Processing Results:')
    console.log(`  Total: ${processResult.total}`)
    console.log(`  Downloaded: ${processResult.downloaded}`)
    console.log(`  Uploaded: ${processResult.uploaded}`)
    console.log(`  Failed: ${processResult.failed}`)
    console.log(`  Skipped: ${processResult.skipped}`)

    if (processResult.errors.length > 0) {
      console.log('\n❌ Errors:')
      for (const error of processResult.errors.slice(0, 10)) {
        console.log(`  - ${error.url}: ${error.error}`)
      }
      if (processResult.errors.length > 10) {
        console.log(`  ... and ${processResult.errors.length - 10} more errors`)
      }
    }

    // Step 3: Update database
    if (!dryRun && processResult.uploaded > 0) {
      const updated = await updateDatabaseUrls(images, dryRun)
      console.log(`\n✅ Updated ${updated} database records`)
    }

    console.log('\n✨ Migration complete!')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

// Run the script
main()

