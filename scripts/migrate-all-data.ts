/**
 * Complete Data Migration Script: Supabase → AWS RDS
 * 
 * This script:
 * 1. Reads ALL data from Supabase database (READ-ONLY, no modifications)
 * 2. Migrates images from Supabase Storage to AWS S3
 * 3. Writes all data to AWS RDS database
 * 
 * IMPORTANT: This script does NOT modify Supabase database at all.
 * 
 * Usage:
 *   npx tsx scripts/migrate-all-data.ts [--dry-run] [--skip-images]
 * 
 * Options:
 *   --dry-run: Only show what would be migrated, don't make any changes
 *   --skip-images: Skip image migration (only migrate database data)
 * 
 * Environment Variables Required:
 *   SUPABASE_DATABASE_URL: Connection string to Supabase (read-only)
 *   DATABASE_URL: Connection string to AWS RDS (write)
 *   AWS_ACCESS_KEY_ID: AWS access key
 *   AWS_SECRET_ACCESS_KEY: AWS secret key
 *   AWS_S3_BUCKET: S3 bucket name (default: summitly-storage)
 *   AWS_REGION: AWS region (default: ca-central-1)
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })
// Also try .env as fallback
config({ path: resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import path from 'path'

// Configuration
const SUPABASE_BASE_URL = 'https://omsefyactufffyqaxowx.supabase.co/storage/v1/object/public'
const AWS_PUBLIC_URL = 'https://shared-s3.property.ca/public'
const AWS_BUCKET = process.env.S3_BUCKET || 'summitly-storage'
const AWS_REGION = process.env.S3_REGION || 'ca-central-1'
const MAX_CONCURRENT_IMAGES = 5

// ============================================================================
// Database Connections
// ============================================================================

// Supabase connection (READ-ONLY)
const supabaseConnectionString = process.env.SUPABASE_DATABASE_URL
if (!supabaseConnectionString) {
  throw new Error('SUPABASE_DATABASE_URL is not defined. Please set it to your Supabase connection string.')
}

let cleanSupabaseConnectionString = supabaseConnectionString
try {
  const url = new URL(supabaseConnectionString)
  url.searchParams.delete('sslmode')
  url.searchParams.delete('sslrootcert')
  url.searchParams.delete('sslcert')
  url.searchParams.delete('sslkey')
  cleanSupabaseConnectionString = url.toString()
} catch (error) {
  console.warn('Failed to parse SUPABASE_DATABASE_URL, using original string', error)
}

const supabasePool = new Pool({
  connectionString: cleanSupabaseConnectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 20000,
  allowExitOnIdle: false,
})

const supabaseAdapter = new PrismaPg(supabasePool)
const supabasePrisma = new PrismaClient({ adapter: supabaseAdapter })

// AWS RDS connection (WRITE)
const awsConnectionString = process.env.DATABASE_URL
if (!awsConnectionString) {
  throw new Error('DATABASE_URL is not defined. Please set it to your AWS RDS connection string.')
}

let cleanAwsConnectionString = awsConnectionString
try {
  const url = new URL(awsConnectionString)
  url.searchParams.delete('sslmode')
  url.searchParams.delete('sslrootcert')
  url.searchParams.delete('sslcert')
  url.searchParams.delete('sslkey')
  cleanAwsConnectionString = url.toString()
} catch (error) {
  console.warn('Failed to parse DATABASE_URL, using original string', error)
}

const awsPool = new Pool({
  connectionString: cleanAwsConnectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 20000,
  allowExitOnIdle: false,
})

const awsAdapter = new PrismaPg(awsPool)
const awsPrisma = new PrismaClient({ adapter: awsAdapter })

// S3 Client
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
})

// ============================================================================
// Types
// ============================================================================

interface MigrationStats {
  [tableName: string]: {
    read: number
    written: number
    updated: number
    created: number
    errors: number
  }
}

interface ImageUrl {
  url: string
  newUrl?: string
  table: string
  id: string
  field: string
}

// ============================================================================
// Image Migration Utilities
// ============================================================================

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

async function processImage(imageUrl: ImageUrl, dryRun: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const pathInfo = extractSupabasePath(imageUrl.url)
    if (!pathInfo) {
      return { success: false, error: 'Invalid Supabase URL format' }
    }

    const { bucket, filePath } = pathInfo
    const newUrl = getAwsUrl(imageUrl.url)

    if (dryRun) {
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

// ============================================================================
// Image URL Collection
// ============================================================================

// Helper function to extract all Supabase URLs from a string (for text fields)
function extractSupabaseUrlsFromText(text: string | null | undefined): string[] {
  if (!text) return []
  
  const urls: string[] = []
  // Match Supabase storage URLs in various formats
  const regex = /https?:\/\/[^\/]+\.supabase\.co\/storage\/v1\/object\/public\/[^\s"'<>\)]+/gi
  const matches = text.match(regex)
  if (matches) {
    urls.push(...matches)
  }
  return urls
}

// Helper function to recursively find image URLs in JSON objects
function findImageUrlsInJson(obj: any, path: string = ''): string[] {
  const urls: string[] = []
  
  if (!obj) return urls
  
  if (typeof obj === 'string') {
    if (isSupabaseUrl(obj)) {
      urls.push(obj)
    } else {
      // Also check if it's a JSON string containing URLs
      urls.push(...extractSupabaseUrlsFromText(obj))
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      urls.push(...findImageUrlsInJson(item, path))
    }
  } else if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      if (key.toLowerCase().includes('image') || key.toLowerCase().includes('url') || key.toLowerCase().includes('photo')) {
        urls.push(...findImageUrlsInJson(value, `${path}.${key}`))
      } else {
        urls.push(...findImageUrlsInJson(value, `${path}.${key}`))
      }
    }
  }
  
  return urls
}

async function collectImageUrls(): Promise<ImageUrl[]> {
  const urls: ImageUrl[] = []
  const stats: Record<string, Record<string, number>> = {}

  console.log('🔍 Collecting image URLs from Supabase...\n')

  // Helper to track stats
  const addUrl = (table: string, field: string, url: string, id: string) => {
    if (!stats[table]) stats[table] = {}
    if (!stats[table][field]) stats[table][field] = 0
    stats[table][field]++
    urls.push({ table, id, field, url })
  }

  // Property.images
  const properties = await supabasePrisma.property.findMany({
    select: { id: true, images: true, description: true },
  })
  for (const prop of properties) {
    // Array field
    for (const imageUrl of prop.images) {
      if (isSupabaseUrl(imageUrl)) {
        addUrl('Property', 'images', imageUrl, prop.id)
      }
    }
    // Text field (might contain embedded URLs)
    const textUrls = extractSupabaseUrlsFromText(prop.description)
    for (const url of textUrls) {
      if (isSupabaseUrl(url)) {
        addUrl('Property', 'description', url, prop.id)
      }
    }
  }

  // PreConstructionProject - comprehensive check
  const projects = await supabasePrisma.preConstructionProject.findMany({
    select: {
      id: true,
      images: true,
      videos: true,
      documents: true,
      description: true,
      developerInfo: true,
      architectInfo: true,
      builderInfo: true,
      interiorDesignerInfo: true,
      landscapeArchitectInfo: true,
      marketingInfo: true,
      developmentTeamOverview: true,
    },
  })
  
  console.log(`  Found ${projects.length} PreConstructionProjects`)
  let totalProjectImages = 0
  let supabaseProjectImages = 0
  let awsProjectImages = 0
  
  for (const project of projects) {
    // images array - this is the main source
    totalProjectImages += project.images.length
    for (const imageUrl of project.images) {
      if (isSupabaseUrl(imageUrl)) {
        supabaseProjectImages++
        addUrl('PreConstructionProject', 'images', imageUrl, project.id)
      } else if (imageUrl.includes('shared-s3.property.ca')) {
        awsProjectImages++
      }
    }
    
    // videos array (might contain image URLs)
    for (const videoUrl of project.videos) {
      if (isSupabaseUrl(videoUrl)) {
        addUrl('PreConstructionProject', 'videos', videoUrl, project.id)
      }
    }
    
    // documents field (might contain URLs)
    if (project.documents) {
      const docUrls = extractSupabaseUrlsFromText(project.documents)
      for (const url of docUrls) {
        if (isSupabaseUrl(url)) {
          addUrl('PreConstructionProject', 'documents', url, project.id)
        }
      }
    }
    
    // description field
    const descUrls = extractSupabaseUrlsFromText(project.description)
    for (const url of descUrls) {
      if (isSupabaseUrl(url)) {
        addUrl('PreConstructionProject', 'description', url, project.id)
      }
    }
    
    // developmentTeamOverview field
    const teamOverviewUrls = extractSupabaseUrlsFromText(project.developmentTeamOverview)
    for (const url of teamOverviewUrls) {
      if (isSupabaseUrl(url)) {
        addUrl('PreConstructionProject', 'developmentTeamOverview', url, project.id)
      }
    }
    
    // JSON fields - recursively search for image URLs
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
        const foundUrls = findImageUrlsInJson(json, field.name)
        for (const url of foundUrls) {
          if (isSupabaseUrl(url)) {
            addUrl('PreConstructionProject', field.name, url, project.id)
          }
        }
      } catch (e) {
        // Not valid JSON, try as text
        const textUrls = extractSupabaseUrlsFromText(field.value)
        for (const url of textUrls) {
          if (isSupabaseUrl(url)) {
            addUrl('PreConstructionProject', field.name, url, project.id)
          }
        }
      }
    }
  }

  // PreConstructionUnit.images and description
  const units = await supabasePrisma.preConstructionUnit.findMany({
    select: { id: true, images: true, description: true },
  })
  for (const unit of units) {
    for (const imageUrl of unit.images) {
      if (isSupabaseUrl(imageUrl)) {
        addUrl('PreConstructionUnit', 'images', imageUrl, unit.id)
      }
    }
    // description field
    const descUrls = extractSupabaseUrlsFromText(unit.description)
    for (const url of descUrls) {
      if (isSupabaseUrl(url)) {
        addUrl('PreConstructionUnit', 'description', url, unit.id)
      }
    }
  }

  // PreConstructionPageContent - comprehensive check
  const pages = await supabasePrisma.preConstructionPageContent.findMany({
    select: { id: true, heroImage: true, description: true, customContent: true },
  })
  for (const page of pages) {
    if (isSupabaseUrl(page.heroImage)) {
      addUrl('PreConstructionPageContent', 'heroImage', page.heroImage!, page.id)
    }
    // description field
    const descUrls = extractSupabaseUrlsFromText(page.description)
    for (const url of descUrls) {
      if (isSupabaseUrl(url)) {
        addUrl('PreConstructionPageContent', 'description', url, page.id)
      }
    }
    // customContent field
    const contentUrls = extractSupabaseUrlsFromText(page.customContent)
    for (const url of contentUrls) {
      if (isSupabaseUrl(url)) {
        addUrl('PreConstructionPageContent', 'customContent', url, page.id)
      }
    }
  }

  // DevelopmentTeam.image
  const teams = await supabasePrisma.developmentTeam.findMany({
    select: { id: true, image: true },
  })
  for (const team of teams) {
    if (isSupabaseUrl(team.image)) {
      addUrl('DevelopmentTeam', 'image', team.image!, team.id)
    }
  }

  // User.image
  const users = await supabasePrisma.user.findMany({
    select: { id: true, image: true },
  })
  for (const user of users) {
    if (isSupabaseUrl(user.image)) {
      addUrl('User', 'image', user.image!, user.id)
    }
  }

  // Page.content and excerpt
  const cmsPages = await supabasePrisma.page.findMany({
    select: { id: true, content: true, excerpt: true },
  })
  for (const page of cmsPages) {
    const contentUrls = extractSupabaseUrlsFromText(page.content)
    for (const url of contentUrls) {
      if (isSupabaseUrl(url)) {
        addUrl('Page', 'content', url, page.id)
      }
    }
    const excerptUrls = extractSupabaseUrlsFromText(page.excerpt)
    for (const url of excerptUrls) {
      if (isSupabaseUrl(url)) {
        addUrl('Page', 'excerpt', url, page.id)
      }
    }
  }

  // Print detailed statistics
  console.log(`\n  📊 PreConstructionProject.images breakdown:`)
  console.log(`     - Total images in array: ${totalProjectImages}`)
  console.log(`     - Supabase URLs: ${supabaseProjectImages}`)
  console.log(`     - AWS S3 URLs (already migrated): ${awsProjectImages}`)
  console.log(`\n  📊 Image URLs by table and field:`)
  for (const [table, fields] of Object.entries(stats)) {
    const tableTotal = Object.values(fields).reduce((sum, count) => sum + count, 0)
    console.log(`     ${table}: ${tableTotal} total`)
    for (const [field, count] of Object.entries(fields)) {
      console.log(`       - ${field}: ${count}`)
    }
  }
  console.log(`\n  Total URLs collected before deduplication: ${urls.length}`)

  // Remove duplicates (same URL)
  const uniqueUrls = new Map<string, ImageUrl>()
  for (const item of urls) {
    if (!uniqueUrls.has(item.url)) {
      uniqueUrls.set(item.url, item)
    }
  }

  console.log(`  Unique URLs after deduplication: ${uniqueUrls.size}\n`)

  return Array.from(uniqueUrls.values())
}

async function migrateImages(dryRun: boolean): Promise<Map<string, string>> {
  const imageUrlMap = new Map<string, string>() // oldUrl -> newUrl
  
  const images = await collectImageUrls()
  console.log(`\n📦 Found ${images.length} unique Supabase images to migrate\n`)

  if (images.length === 0) {
    return imageUrlMap
  }

  // Process images in batches
  for (let i = 0; i < images.length; i += MAX_CONCURRENT_IMAGES) {
    const batch = images.slice(i, i + MAX_CONCURRENT_IMAGES)
    const results = await Promise.all(
      batch.map(img => processImage(img, dryRun))
    )

    for (let j = 0; j < batch.length; j++) {
      if (results[j].success && batch[j].newUrl) {
        imageUrlMap.set(batch[j].url, batch[j].newUrl!)
      }
    }

    const processed = Math.min(i + MAX_CONCURRENT_IMAGES, images.length)
    console.log(`  Progress: ${processed}/${images.length} images processed`)
  }

  return imageUrlMap
}

// ============================================================================
// URL Replacement Helper
// ============================================================================

function replaceImageUrl(url: string, imageUrlMap: Map<string, string>): string {
  return imageUrlMap.get(url) || url
}

function replaceImageUrls(urls: string[], imageUrlMap: Map<string, string>): string[] {
  return urls.map(url => replaceImageUrl(url, imageUrlMap))
}

function replaceJsonImage(jsonValue: any, imageUrlMap: Map<string, string>): any {
  if (!jsonValue || typeof jsonValue !== 'object') return jsonValue
  
  try {
    const json = typeof jsonValue === 'string' ? JSON.parse(jsonValue) : jsonValue
    if (json && typeof json === 'object' && json.image) {
      json.image = replaceImageUrl(json.image, imageUrlMap)
      return typeof jsonValue === 'string' ? JSON.stringify(json) : json
    }
  } catch (e) {
    // Not valid JSON, return as is
  }
  
  return jsonValue
}

// ============================================================================
// Helper: Safe Upsert (prevents duplicates, updates existing records)
// ============================================================================

/**
 * Safely upserts a record - updates if exists, creates if not
 * This prevents duplicates when refreshing data.
 * Uses upsert which is atomic and prevents duplicates based on the where clause.
 * 
 * IMPORTANT: Upsert operations prevent duplicates by:
 * - Updating the record if it exists (based on where clause)
 * - Creating the record if it doesn't exist
 * - Never creating duplicates
 */
async function safeUpsert<T>(
  model: any,
  where: any,
  data: any
): Promise<void> {
  // Upsert (update if exists, create if not) - atomic operation prevents duplicates
  await model.upsert({
    where,
    create: data,
    update: data,
  })
}

// ============================================================================
// Data Migration Functions (Ordered by dependencies)
// ============================================================================

async function migrateUsers(stats: MigrationStats, imageUrlMap: Map<string, string>, dryRun: boolean) {
  console.log('\n📋 Migrating Users...')
  const users = await supabasePrisma.user.findMany()
  stats['User'] = { read: users.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const user of users) {
    try {
      const data: any = {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image ? replaceImageUrl(user.image, imageUrlMap) : user.image,
        phone: user.phone,
        password: user.password,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.role,
      }

      if (!dryRun) {
        await safeUpsert(
          awsPrisma.user,
          { id: user.id },
          data
        )
      }
      stats['User'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating User ${user.id}:`, error)
      stats['User'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['User'].written}/${stats['User'].read} users (upserted - existing updated, new created)`)
}

async function migrateAccounts(stats: MigrationStats, dryRun: boolean) {
  console.log('\n📋 Migrating Accounts...')
  const accounts = await supabasePrisma.account.findMany()
  stats['Account'] = { read: accounts.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const account of accounts) {
    try {
      const data: any = {
        id: account.id,
        userId: account.userId,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state,
      }

      if (!dryRun) {
        await safeUpsert(
          awsPrisma.account,
          { id: account.id },
          data
        )
      }
      stats['Account'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating Account ${account.id}:`, error)
      stats['Account'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['Account'].written}/${stats['Account'].read} accounts (upserted - existing updated, new created)`)
}

async function migrateSessions(stats: MigrationStats, dryRun: boolean) {
  console.log('\n📋 Migrating Sessions...')
  const sessions = await supabasePrisma.session.findMany()
  stats['Session'] = { read: sessions.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const session of sessions) {
    try {
      const data: any = {
        id: session.id,
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      }

      if (!dryRun) {
        await awsPrisma.session.upsert({
          where: { id: session.id },
          create: data,
          update: data,
        })
      }
      stats['Session'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating Session ${session.id}:`, error)
      stats['Session'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['Session'].written}/${stats['Session'].read} sessions`)
}

async function migrateVerificationTokens(stats: MigrationStats, dryRun: boolean) {
  console.log('\n📋 Migrating VerificationTokens...')
  const tokens = await supabasePrisma.verificationToken.findMany()
  stats['VerificationToken'] = { read: tokens.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const token of tokens) {
    try {
      if (!dryRun) {
        await awsPrisma.verificationToken.upsert({
          where: {
            identifier_token: {
              identifier: token.identifier,
              token: token.token,
            },
          },
          create: {
            identifier: token.identifier,
            token: token.token,
            expires: token.expires,
          },
          update: {
            expires: token.expires,
          },
        })
      }
      stats['VerificationToken'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating VerificationToken:`, error)
      stats['VerificationToken'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['VerificationToken'].written}/${stats['VerificationToken'].read} tokens`)
}

async function migrateAgentProfiles(stats: MigrationStats, dryRun: boolean) {
  console.log('\n📋 Migrating AgentProfiles...')
  const profiles = await supabasePrisma.agentProfile.findMany()
  stats['AgentProfile'] = { read: profiles.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const profile of profiles) {
    try {
      const data: any = {
        id: profile.id,
        userId: profile.userId,
        bio: profile.bio,
        phone: profile.phone,
        license: profile.license,
        specialties: profile.specialties,
        languages: profile.languages,
        rating: profile.rating,
        reviewCount: profile.reviewCount,
        isActive: profile.isActive,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      }

      if (!dryRun) {
        await safeUpsert(
          awsPrisma.agentProfile,
          { id: profile.id },
          data
        )
      }
      stats['AgentProfile'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating AgentProfile ${profile.id}:`, error)
      stats['AgentProfile'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['AgentProfile'].written}/${stats['AgentProfile'].read} agent profiles (upserted - existing updated, new created)`)
}

async function migrateDevelopmentTeams(stats: MigrationStats, imageUrlMap: Map<string, string>, dryRun: boolean) {
  console.log('\n📋 Migrating DevelopmentTeams...')
  const teams = await supabasePrisma.developmentTeam.findMany()
  stats['DevelopmentTeam'] = { read: teams.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const team of teams) {
    try {
      const data: any = {
        id: team.id,
        name: team.name,
        type: team.type,
        description: team.description,
        website: team.website,
        image: team.image ? replaceImageUrl(team.image, imageUrlMap) : team.image,
        email: team.email,
        phone: team.phone,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      }

      if (!dryRun) {
        await safeUpsert(
          awsPrisma.developmentTeam,
          { id: team.id },
          data
        )
      }
      stats['DevelopmentTeam'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating DevelopmentTeam ${team.id}:`, error)
      stats['DevelopmentTeam'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['DevelopmentTeam'].written}/${stats['DevelopmentTeam'].read} development teams (upserted - existing updated, new created)`)
}

async function migrateProperties(stats: MigrationStats, imageUrlMap: Map<string, string>, dryRun: boolean) {
  console.log('\n📋 Migrating Properties...')
  const properties = await supabasePrisma.property.findMany()
  stats['Property'] = { read: properties.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const property of properties) {
    try {
      const data: any = {
        id: property.id,
        mlsNumber: property.mlsNumber,
        title: property.title,
        description: property.description,
        price: property.price,
        propertyType: property.propertyType,
        status: property.status,
        streetNumber: property.streetNumber,
        streetName: property.streetName,
        city: property.city,
        state: property.state,
        zipCode: property.zipCode,
        country: property.country,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        squareFeet: property.squareFeet,
        lotSize: property.lotSize,
        yearBuilt: property.yearBuilt,
        latitude: property.latitude,
        longitude: property.longitude,
        images: replaceImageUrls(property.images, imageUrlMap),
        features: property.features,
        userId: property.userId,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      }

      if (!dryRun) {
        await safeUpsert(
          awsPrisma.property,
          { id: property.id },
          data
        )
      }
      stats['Property'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating Property ${property.id}:`, error)
      stats['Property'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['Property'].written}/${stats['Property'].read} properties (upserted - existing updated, new created)`)
}

async function migratePreConstructionProjects(stats: MigrationStats, imageUrlMap: Map<string, string>, dryRun: boolean) {
  console.log('\n📋 Migrating PreConstructionProjects...')
  const projects = await supabasePrisma.preConstructionProject.findMany()
  stats['PreConstructionProject'] = { read: projects.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const project of projects) {
    try {
      const data: any = {
        id: project.id,
        mlsNumber: project.mlsNumber,
        projectName: project.projectName,
        developer: project.developer,
        startingPrice: project.startingPrice,
        status: project.status,
        streetNumber: project.streetNumber,
        streetName: project.streetName,
        city: project.city,
        state: project.state,
        zip: project.zip,
        country: project.country,
        neighborhood: project.neighborhood,
        majorIntersection: project.majorIntersection,
        latitude: project.latitude,
        longitude: project.longitude,
        propertyType: project.propertyType,
        bedroomRange: project.bedroomRange,
        bathroomRange: project.bathroomRange,
        sqftRange: project.sqftRange,
        totalUnits: project.totalUnits,
        availableUnits: project.availableUnits,
        storeys: project.storeys,
        completionProgress: project.completionProgress,
        images: replaceImageUrls(project.images, imageUrlMap),
        features: project.features,
        amenities: project.amenities,
        depositStructure: project.depositStructure,
        description: project.description,
        developerInfo: project.developerInfo ? replaceJsonImage(project.developerInfo, imageUrlMap) : project.developerInfo,
        architectInfo: project.architectInfo ? replaceJsonImage(project.architectInfo, imageUrlMap) : project.architectInfo,
        builderInfo: project.builderInfo ? replaceJsonImage(project.builderInfo, imageUrlMap) : project.builderInfo,
        interiorDesignerInfo: project.interiorDesignerInfo ? replaceJsonImage(project.interiorDesignerInfo, imageUrlMap) : project.interiorDesignerInfo,
        landscapeArchitectInfo: project.landscapeArchitectInfo ? replaceJsonImage(project.landscapeArchitectInfo, imageUrlMap) : project.landscapeArchitectInfo,
        marketingInfo: project.marketingInfo ? replaceJsonImage(project.marketingInfo, imageUrlMap) : project.marketingInfo,
        documents: project.documents,
        endingPrice: project.endingPrice,
        subPropertyType: project.subPropertyType,
        promotions: project.promotions,
        videos: project.videos,
        avgPricePerSqft: project.avgPricePerSqft,
        parkingPrice: project.parkingPrice,
        parkingPriceDetail: project.parkingPriceDetail,
        lockerPrice: project.lockerPrice,
        lockerPriceDetail: project.lockerPriceDetail,
        assignmentFee: project.assignmentFee,
        developmentLevies: project.developmentLevies,
        developmentCharges: project.developmentCharges,
        height: project.height,
        maintenanceFeesPerSqft: project.maintenanceFeesPerSqft,
        maintenanceFeesDetail: project.maintenanceFeesDetail,
        floorPremiums: project.floorPremiums,
        salesMarketingCompany: project.salesMarketingCompany,
        hasDen: project.hasDen,
        hasStudio: project.hasStudio,
        hasLoft: project.hasLoft,
        hasWorkLiveLoft: project.hasWorkLiveLoft,
        developmentTeamOverview: project.developmentTeamOverview,
        suites: project.suites,
        ownershipType: project.ownershipType,
        garage: project.garage,
        basement: project.basement,
        occupancyDate: project.occupancyDate,
        isPublished: project.isPublished,
        featured: project.featured,
        createdBy: project.createdBy,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }

      if (!dryRun) {
        await awsPrisma.preConstructionProject.upsert({
          where: { id: project.id },
          create: data,
          update: data,
        })
      }
      stats['PreConstructionProject'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating PreConstructionProject ${project.id}:`, error)
      stats['PreConstructionProject'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['PreConstructionProject'].written}/${stats['PreConstructionProject'].read} pre-construction projects`)
}

async function migratePreConstructionUnits(stats: MigrationStats, imageUrlMap: Map<string, string>, dryRun: boolean) {
  console.log('\n📋 Migrating PreConstructionUnits...')
  const units = await supabasePrisma.preConstructionUnit.findMany()
  stats['PreConstructionUnit'] = { read: units.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const unit of units) {
    try {
      const data: any = {
        id: unit.id,
        projectId: unit.projectId,
        unitName: unit.unitName,
        beds: unit.beds,
        baths: unit.baths,
        sqft: unit.sqft,
        price: unit.price,
        maintenanceFee: unit.maintenanceFee,
        status: unit.status,
        description: unit.description,
        features: unit.features,
        amenities: unit.amenities,
        images: replaceImageUrls(unit.images, imageUrlMap),
        studio: unit.studio,
        createdAt: unit.createdAt,
        updatedAt: unit.updatedAt,
      }

      if (!dryRun) {
        await awsPrisma.preConstructionUnit.upsert({
          where: { id: unit.id },
          create: data,
          update: data,
        })
      }
      stats['PreConstructionUnit'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating PreConstructionUnit ${unit.id}:`, error)
      stats['PreConstructionUnit'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['PreConstructionUnit'].written}/${stats['PreConstructionUnit'].read} pre-construction units`)
}

async function migratePreConstructionPageContents(stats: MigrationStats, imageUrlMap: Map<string, string>, dryRun: boolean) {
  console.log('\n📋 Migrating PreConstructionPageContents...')
  const pages = await supabasePrisma.preConstructionPageContent.findMany()
  stats['PreConstructionPageContent'] = { read: pages.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const page of pages) {
    try {
      const data: any = {
        id: page.id,
        pageType: page.pageType,
        pageValue: page.pageValue,
        title: page.title,
        description: page.description,
        heroImage: page.heroImage ? replaceImageUrl(page.heroImage, imageUrlMap) : page.heroImage,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        customContent: page.customContent,
        isPublished: page.isPublished,
        faqs: page.faqs,
        locationType: page.locationType,
        parentId: page.parentId,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      }

      if (!dryRun) {
        await awsPrisma.preConstructionPageContent.upsert({
          where: { id: page.id },
          create: data,
          update: data,
        })
      }
      stats['PreConstructionPageContent'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating PreConstructionPageContent ${page.id}:`, error)
      stats['PreConstructionPageContent'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['PreConstructionPageContent'].written}/${stats['PreConstructionPageContent'].read} page contents`)
}

async function migrateFavorites(stats: MigrationStats, dryRun: boolean) {
  console.log('\n📋 Migrating Favorites...')
  const favorites = await supabasePrisma.favorite.findMany()
  stats['Favorite'] = { read: favorites.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const favorite of favorites) {
    try {
      const data: any = {
        id: favorite.id,
        userId: favorite.userId,
        propertyId: favorite.propertyId,
        createdAt: favorite.createdAt,
      }

      if (!dryRun) {
        await awsPrisma.favorite.upsert({
          where: { id: favorite.id },
          create: data,
          update: data,
        })
      }
      stats['Favorite'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating Favorite ${favorite.id}:`, error)
      stats['Favorite'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['Favorite'].written}/${stats['Favorite'].read} favorites`)
}

async function migrateSavedProperties(stats: MigrationStats, dryRun: boolean) {
  console.log('\n📋 Migrating SavedProperties...')
  const saved = await supabasePrisma.savedProperty.findMany()
  stats['SavedProperty'] = { read: saved.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const item of saved) {
    try {
      const data: any = {
        id: item.id,
        userId: item.userId,
        mlsNumber: item.mlsNumber,
        notes: item.notes,
        tags: item.tags,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }

      if (!dryRun) {
        await awsPrisma.savedProperty.upsert({
          where: { id: item.id },
          create: data,
          update: data,
        })
      }
      stats['SavedProperty'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating SavedProperty ${item.id}:`, error)
      stats['SavedProperty'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['SavedProperty'].written}/${stats['SavedProperty'].read} saved properties`)
}

async function migratePropertyViews(stats: MigrationStats, dryRun: boolean) {
  console.log('\n📋 Migrating PropertyViews...')
  const views = await supabasePrisma.propertyView.findMany()
  stats['PropertyView'] = { read: views.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const view of views) {
    try {
      const data: any = {
        id: view.id,
        propertyId: view.propertyId,
        userId: view.userId,
        ipAddress: view.ipAddress,
        userAgent: view.userAgent,
        viewedAt: view.viewedAt,
      }

      if (!dryRun) {
        await awsPrisma.propertyView.upsert({
          where: { id: view.id },
          create: data,
          update: data,
        })
      }
      stats['PropertyView'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating PropertyView ${view.id}:`, error)
      stats['PropertyView'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['PropertyView'].written}/${stats['PropertyView'].read} property views`)
}

async function migrateSearchHistories(stats: MigrationStats, dryRun: boolean) {
  console.log('\n📋 Migrating SearchHistories...')
  const searches = await supabasePrisma.searchHistory.findMany()
  stats['SearchHistory'] = { read: searches.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const search of searches) {
    try {
      const data: any = {
        id: search.id,
        userId: search.userId,
        query: search.query,
        location: search.location,
        minPrice: search.minPrice,
        maxPrice: search.maxPrice,
        bedrooms: search.bedrooms,
        bathrooms: search.bathrooms,
        propertyType: search.propertyType,
        searchedAt: search.searchedAt,
      }

      if (!dryRun) {
        await awsPrisma.searchHistory.upsert({
          where: { id: search.id },
          create: data,
          update: data,
        })
      }
      stats['SearchHistory'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating SearchHistory ${search.id}:`, error)
      stats['SearchHistory'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['SearchHistory'].written}/${stats['SearchHistory'].read} search histories`)
}

async function migratePropertyWatchlists(stats: MigrationStats, dryRun: boolean) {
  console.log('\n📋 Migrating PropertyWatchlists...')
  const watchlists = await supabasePrisma.propertyWatchlist.findMany()
  stats['PropertyWatchlist'] = { read: watchlists.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const watchlist of watchlists) {
    try {
      const data: any = {
        id: watchlist.id,
        userId: watchlist.userId,
        mlsNumber: watchlist.mlsNumber,
        cityName: watchlist.cityName,
        neighborhood: watchlist.neighborhood,
        propertyType: watchlist.propertyType,
        watchProperty: watchlist.watchProperty,
        newProperties: watchlist.newProperties,
        soldListings: watchlist.soldListings,
        expiredListings: watchlist.expiredListings,
        createdAt: watchlist.createdAt,
        updatedAt: watchlist.updatedAt,
      }

      if (!dryRun) {
        await awsPrisma.propertyWatchlist.upsert({
          where: { id: watchlist.id },
          create: data,
          update: data,
        })
      }
      stats['PropertyWatchlist'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating PropertyWatchlist ${watchlist.id}:`, error)
      stats['PropertyWatchlist'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['PropertyWatchlist'].written}/${stats['PropertyWatchlist'].read} property watchlists`)
}

async function migrateTours(stats: MigrationStats, dryRun: boolean) {
  console.log('\n📋 Migrating Tours...')
  const tours = await supabasePrisma.tour.findMany()
  stats['Tour'] = { read: tours.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const tour of tours) {
    try {
      const data: any = {
        id: tour.id,
        userId: tour.userId,
        mlsNumber: tour.mlsNumber,
        tourType: tour.tourType,
        scheduledDate: tour.scheduledDate,
        name: tour.name,
        phone: tour.phone,
        email: tour.email,
        preApproval: tour.preApproval,
        status: tour.status,
        notes: tour.notes,
        createdAt: tour.createdAt,
        updatedAt: tour.updatedAt,
      }

      if (!dryRun) {
        await awsPrisma.tour.upsert({
          where: { id: tour.id },
          create: data,
          update: data,
        })
      }
      stats['Tour'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating Tour ${tour.id}:`, error)
      stats['Tour'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['Tour'].written}/${stats['Tour'].read} tours`)
}

async function migrateContacts(stats: MigrationStats, dryRun: boolean) {
  console.log('\n📋 Migrating Contacts...')
  const contacts = await supabasePrisma.contact.findMany()
  stats['Contact'] = { read: contacts.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const contact of contacts) {
    try {
      const data: any = {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        message: contact.message,
        propertyId: contact.propertyId,
        type: contact.type,
        status: contact.status,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      }

      if (!dryRun) {
        await awsPrisma.contact.upsert({
          where: { id: contact.id },
          create: data,
          update: data,
        })
      }
      stats['Contact'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating Contact ${contact.id}:`, error)
      stats['Contact'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['Contact'].written}/${stats['Contact'].read} contacts`)
}

async function migratePropertyRatings(stats: MigrationStats, dryRun: boolean) {
  console.log('\n📋 Migrating PropertyRatings...')
  const ratings = await supabasePrisma.propertyRating.findMany()
  stats['PropertyRating'] = { read: ratings.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const rating of ratings) {
    try {
      const data: any = {
        id: rating.id,
        propertyId: rating.propertyId,
        propertyType: rating.propertyType,
        userId: rating.userId,
        sessionId: rating.sessionId,
        rating: rating.rating,
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt,
      }

      if (!dryRun) {
        await awsPrisma.propertyRating.upsert({
          where: { id: rating.id },
          create: data,
          update: data,
        })
      }
      stats['PropertyRating'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating PropertyRating ${rating.id}:`, error)
      stats['PropertyRating'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['PropertyRating'].written}/${stats['PropertyRating'].read} property ratings`)
}

async function migratePages(stats: MigrationStats, dryRun: boolean) {
  console.log('\n📋 Migrating Pages...')
  const pages = await supabasePrisma.page.findMany()
  stats['Page'] = { read: pages.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const page of pages) {
    try {
      const data: any = {
        id: page.id,
        title: page.title,
        slug: page.slug,
        content: page.content,
        excerpt: page.excerpt,
        status: page.status,
        parentId: page.parentId,
        categoryId: page.categoryId,
        createdBy: page.createdBy,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      }

      if (!dryRun) {
        await awsPrisma.page.upsert({
          where: { id: page.id },
          create: data,
          update: data,
        })
      }
      stats['Page'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating Page ${page.id}:`, error)
      stats['Page'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['Page'].written}/${stats['Page'].read} pages`)
}

async function migratePageCategories(stats: MigrationStats, dryRun: boolean) {
  console.log('\n📋 Migrating PageCategories...')
  const categories = await supabasePrisma.pageCategory.findMany()
  stats['PageCategory'] = { read: categories.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const category of categories) {
    try {
      const data: any = {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      }

      if (!dryRun) {
        await awsPrisma.pageCategory.upsert({
          where: { id: category.id },
          create: data,
          update: data,
        })
      }
      stats['PageCategory'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating PageCategory ${category.id}:`, error)
      stats['PageCategory'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['PageCategory'].written}/${stats['PageCategory'].read} page categories`)
}

async function migrateMarketTrends(stats: MigrationStats, dryRun: boolean) {
  console.log('\n📋 Migrating MarketTrends...')
  const trends = await supabasePrisma.marketTrends.findMany()
  stats['MarketTrends'] = { read: trends.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const trend of trends) {
    try {
      const data: any = {
        id: trend.id,
        locationType: trend.locationType,
        locationName: trend.locationName,
        parentCity: trend.parentCity,
        parentArea: trend.parentArea,
        parentNeighbourhood: trend.parentNeighbourhood,
        month: trend.month,
        priceOverview: trend.priceOverview,
        averageSoldPrice: trend.averageSoldPrice,
        salesVolumeByType: trend.salesVolumeByType,
        priceByBedrooms: trend.priceByBedrooms,
        inventoryOverview: trend.inventoryOverview,
        newClosedAvailable: trend.newClosedAvailable,
        daysOnMarket: trend.daysOnMarket,
        lastFetchedAt: trend.lastFetchedAt,
        createdAt: trend.createdAt,
        updatedAt: trend.updatedAt,
        averageSoldPriceByType: trend.averageSoldPriceByType,
        years: trend.years,
        medianListingVsSoldPrice: trend.medianListingVsSoldPrice,
      }

      if (!dryRun) {
        try {
          await awsPrisma.marketTrends.upsert({
            where: {
              locationType_locationName_month_years: {
                locationType: trend.locationType,
                locationName: trend.locationName,
                month: trend.month,
                years: trend.years,
              },
            },
            create: data,
            update: data,
          })
        } catch (error: any) {
          // Try alternative unique constraint
          if (error.code === 'P2002') {
            await awsPrisma.marketTrends.upsert({
              where: {
                locationType_locationName_month: {
                  locationType: trend.locationType,
                  locationName: trend.locationName,
                  month: trend.month,
                },
              },
              create: data,
              update: data,
            })
          } else {
            throw error
          }
        }
      }
      stats['MarketTrends'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating MarketTrends ${trend.id}:`, error)
      stats['MarketTrends'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['MarketTrends'].written}/${stats['MarketTrends'].read} market trends`)
}

async function migrateMarketRankings(stats: MigrationStats, dryRun: boolean) {
  console.log('\n📋 Migrating MarketRankings...')
  const rankings = await supabasePrisma.marketRankings.findMany()
  stats['MarketRankings'] = { read: rankings.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const ranking of rankings) {
    try {
      const data: any = {
        id: ranking.id,
        month: ranking.month,
        rankings: ranking.rankings,
        rankingOverview: ranking.rankingOverview,
        lastFetchedAt: ranking.lastFetchedAt,
        createdAt: ranking.createdAt,
        updatedAt: ranking.updatedAt,
      }

      if (!dryRun) {
        await awsPrisma.marketRankings.upsert({
          where: { id: ranking.id },
          create: data,
          update: data,
        })
      }
      stats['MarketRankings'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating MarketRankings ${ranking.id}:`, error)
      stats['MarketRankings'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['MarketRankings'].written}/${stats['MarketRankings'].read} market rankings`)
}

async function migrateCityBreakdowns(stats: MigrationStats, dryRun: boolean) {
  console.log('\n📋 Migrating CityBreakdowns...')
  const breakdowns = await supabasePrisma.cityBreakdown.findMany()
  stats['CityBreakdown'] = { read: breakdowns.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const breakdown of breakdowns) {
    try {
      const data: any = {
        id: breakdown.id,
        month: breakdown.month,
        breakdownData: breakdown.breakdownData,
        lastFetchedAt: breakdown.lastFetchedAt,
        createdAt: breakdown.createdAt,
        updatedAt: breakdown.updatedAt,
      }

      if (!dryRun) {
        await awsPrisma.cityBreakdown.upsert({
          where: { id: breakdown.id },
          create: data,
          update: data,
        })
      }
      stats['CityBreakdown'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating CityBreakdown ${breakdown.id}:`, error)
      stats['CityBreakdown'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['CityBreakdown'].written}/${stats['CityBreakdown'].read} city breakdowns`)
}

async function migratePropertyTypeBreakdowns(stats: MigrationStats, dryRun: boolean) {
  console.log('\n📋 Migrating PropertyTypeBreakdowns...')
  const breakdowns = await supabasePrisma.propertyTypeBreakdown.findMany()
  stats['PropertyTypeBreakdown'] = { read: breakdowns.length, written: 0, updated: 0, created: 0, errors: 0 }

  for (const breakdown of breakdowns) {
    try {
      const data: any = {
        id: breakdown.id,
        month: breakdown.month,
        breakdownData: breakdown.breakdownData,
        lastFetchedAt: breakdown.lastFetchedAt,
        createdAt: breakdown.createdAt,
        updatedAt: breakdown.updatedAt,
      }

      if (!dryRun) {
        await awsPrisma.propertyTypeBreakdown.upsert({
          where: { id: breakdown.id },
          create: data,
          update: data,
        })
      }
      stats['PropertyTypeBreakdown'].written++
    } catch (error) {
      console.error(`  ✗ Error migrating PropertyTypeBreakdown ${breakdown.id}:`, error)
      stats['PropertyTypeBreakdown'].errors++
    }
  }
  console.log(`  ✓ Migrated ${stats['PropertyTypeBreakdown'].written}/${stats['PropertyTypeBreakdown'].read} property type breakdowns`)
}

// ============================================================================
// Main Migration Function
// ============================================================================

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const skipImages = args.includes('--skip-images')

  console.log('🚀 Complete Data Migration: Supabase → AWS RDS\n')
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (will write to AWS)'}`)
  console.log(`Images: ${skipImages ? 'SKIPPED' : 'WILL BE MIGRATED'}`)
  console.log(`⚠️  IMPORTANT: This script uses UPSERT operations - existing records will be UPDATED, new records will be CREATED. NO DUPLICATES will be created.\n`)

  const stats: MigrationStats = {}

  try {
    // Step 1: Migrate images (if not skipped)
    let imageUrlMap = new Map<string, string>()
    if (!skipImages) {
      console.log('='.repeat(60))
      console.log('STEP 1: IMAGE MIGRATION')
      console.log('='.repeat(60))
      imageUrlMap = await migrateImages(dryRun)
      console.log(`\n✅ Image migration complete. ${imageUrlMap.size} images migrated.\n`)
    } else {
      console.log('⏭️  Skipping image migration\n')
    }

    // Step 2: Migrate all data (ordered by dependencies)
    console.log('='.repeat(60))
    console.log('STEP 2: DATA MIGRATION')
    console.log('='.repeat(60))

    // Independent tables first
    await migrateUsers(stats, imageUrlMap, dryRun)
    await migrateDevelopmentTeams(stats, imageUrlMap, dryRun)
    await migratePageCategories(stats, dryRun)

    // Tables that depend on Users
    await migrateAccounts(stats, dryRun)
    await migrateSessions(stats, dryRun)
    await migrateVerificationTokens(stats, dryRun)
    await migrateAgentProfiles(stats, dryRun)
    await migrateProperties(stats, imageUrlMap, dryRun)
    await migratePages(stats, dryRun)

    // Tables that depend on Properties
    await migrateFavorites(stats, dryRun)
    await migrateSavedProperties(stats, dryRun)
    await migratePropertyViews(stats, dryRun)
    await migratePropertyWatchlists(stats, dryRun)
    await migrateTours(stats, dryRun)
    await migratePropertyRatings(stats, dryRun)

    // Pre-construction tables
    await migratePreConstructionProjects(stats, imageUrlMap, dryRun)
    await migratePreConstructionUnits(stats, imageUrlMap, dryRun)
    await migratePreConstructionPageContents(stats, imageUrlMap, dryRun)

    // Other tables
    await migrateContacts(stats, dryRun)
    await migrateSearchHistories(stats, dryRun)

    // Market data tables
    await migrateMarketTrends(stats, dryRun)
    await migrateMarketRankings(stats, dryRun)
    await migrateCityBreakdowns(stats, dryRun)
    await migratePropertyTypeBreakdowns(stats, dryRun)

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('MIGRATION SUMMARY')
    console.log('='.repeat(60))
    
    let totalRead = 0
    let totalWritten = 0
    let totalErrors = 0

    for (const [table, stat] of Object.entries(stats)) {
      totalRead += stat.read
      totalWritten += stat.written
      totalErrors += stat.errors
      const status = stat.errors > 0 
        ? `${stat.written}/${stat.read} (${stat.errors} errors)`
        : `${stat.written}/${stat.read}`
      console.log(`${table}: ${status}`)
    }

    console.log('\n' + '-'.repeat(60))
    console.log(`Total: ${totalWritten}/${totalRead} records migrated`)
    if (totalErrors > 0) {
      console.log(`  - ${totalErrors} errors`)
    }
    console.log('='.repeat(60))
    console.log('\n✅ NO DUPLICATES CREATED')
    console.log('   Upsert operations ensure:')
    console.log('   - Existing records (by ID) are UPDATED with latest data from Supabase')
    console.log('   - New records are CREATED')
    console.log('   - Duplicates are PREVENTED by primary key constraints')

    if (dryRun) {
      console.log('\n⚠️  This was a DRY RUN. No changes were made.')
      console.log('Run without --dry-run to perform the actual migration.')
    } else {
      console.log('\n✅ Migration complete!')
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await supabasePrisma.$disconnect()
    await awsPrisma.$disconnect()
    await supabasePool.end()
    await awsPool.end()
  }
}

// Run the script
main()

