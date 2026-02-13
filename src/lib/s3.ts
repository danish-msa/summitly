import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

/**
 * AWS S3 Client Configuration
 *
 * Uses environment variables (either set works):
 * - S3_ACCESS_KEY_ID or AWS_ACCESS_KEY_ID
 * - S3_SECRET_ACCESS_KEY or AWS_SECRET_ACCESS_KEY
 * - S3_REGION or AWS_REGION (default: ca-central-1)
 * - S3_BUCKET or AWS_S3_BUCKET (default: summitly-storage)
 *
 * Public read (avoid 403 on agent/profile images):
 * - We set ACL: 'public-read' on upload. If your bucket has "Object Ownership"
 *   set to "Bucket owner enforced", ACLs are disabled and upload will fall back
 *   without ACL. In that case, add a bucket policy to allow public GetObject, e.g.:
 *   For prefix "images/agents/*": allow "s3:GetObject" for principal "*".
 */
const S3_ACCESS = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || ''
const S3_SECRET = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || ''
const s3Client = new S3Client({
  region: process.env.S3_REGION || process.env.AWS_REGION || 'ca-central-1',
  credentials: {
    accessKeyId: S3_ACCESS,
    secretAccessKey: S3_SECRET,
  },
})

const BUCKET_NAME = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || 'summitly-storage'
const S3_REGION = process.env.S3_REGION || process.env.AWS_REGION || 'ca-central-1'
const DIRECT_S3_PUBLIC_URL = `https://${BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com`
// const REGION = process.env.S3_REGION || 'ca-central-1'
// AWS S3 Public URL - using custom domain
const AWS_PUBLIC_URL = 'https://shared-s3.property.ca/public'

/**
 * Upload a file to S3
 * @param filePath - Path within the bucket (e.g., 'images/pre-con/projects/file.jpg')
 * @param buffer - File buffer
 * @param contentType - MIME type (e.g., 'image/jpeg')
 * @returns Public URL of the uploaded file
 */
export async function uploadToS3(
  filePath: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
      Body: buffer,
      ContentType: contentType,
      // Make object publicly readable so next/image and img tags can load it.
      ACL: 'public-read',
    })

    await s3Client.send(command)

    // Return direct S3 URL so images load without depending on custom domain (shared-s3.property.ca) config
    return `${DIRECT_S3_PUBLIC_URL}/${filePath}`
  } catch (error: unknown) {
    const err = error as { name?: string; Code?: string }
    // Bucket may have "bucket owner enforced" object ownership (ACLs disabled)
    if (err.name === 'AccessControlListNotSupported' || err.Code === 'AccessControlListNotSupported') {
      try {
        const fallbackCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: filePath,
          Body: buffer,
          ContentType: contentType,
        })
        await s3Client.send(fallbackCommand)
        console.warn(
          'S3: ACL not supported; object uploaded without public-read. Add a bucket policy allowing public GetObject for images/agents/* to avoid 403.'
        )
        return `${DIRECT_S3_PUBLIC_URL}/${filePath}`
      } catch (fallbackError) {
        console.error('S3 upload fallback error:', fallbackError)
        throw new Error(`Failed to upload to S3: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`)
      }
    }
    console.error('S3 upload error:', error)
    throw new Error(`Failed to upload to S3: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get public URL for an S3 object
 * @param filePath - Path within the bucket
 * @returns Public URL
 */
export function getS3PublicUrl(filePath: string): string {
  return `${AWS_PUBLIC_URL}/${filePath}`
}

/**
 * Convert legacy storage URL to S3 URL (for backward compatibility)
 * @param url - Legacy storage URL
 * @returns S3 URL or original URL if not a legacy storage URL
 */
export function convertSupabaseUrlToS3(url: string): string {
  if (!url) return url

  // Check if it's a legacy storage URL (kept for backward compatibility)
  const legacyPattern =
    /https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/(images|documents)\/(.+)$/
  const match = url.match(legacyPattern)

  if (match) {
    const [, bucket, path] = match
    // Convert to S3 URL format
    return getS3PublicUrl(`${bucket}/${path}`)
  }

  // Return original URL if not a legacy storage URL
  return url
}

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const
const EXT_TO_TYPE: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

/**
 * If the URL is our custom domain (shared-s3.property.ca), return the direct S3 URL
 * so the image loads even when the custom domain returns 403.
 */
export function toDirectS3UrlIfNeeded(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return url ?? null
  const u = url.trim()
  const prefix = 'https://shared-s3.property.ca/public/'
  if (!u.startsWith(prefix)) return u
  const key = u.slice(prefix.length)
  return `${DIRECT_S3_PUBLIC_URL}/${key}`
}

/**
 * Check if a URL is already our S3 (or known internal) storage – no need to re-upload.
 */
export function isOurStorageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  const u = url.trim()
  return (
    u.startsWith(AWS_PUBLIC_URL) ||
    u.includes('shared-s3.property.ca') ||
    u.includes('s3.amazonaws.com') ||
    u.includes('s3.ca-central-1.amazonaws.com')
  )
}

/**
 * Fetch an image from a public URL and upload it to S3.
 * @param imageUrl - Public image URL (http/https)
 * @param folder - S3 folder under images/agents (e.g. 'profile' or 'cover')
 * @returns Public S3 URL of the uploaded image
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  folder: string
): Promise<string> {
  if (!S3_ACCESS || !S3_SECRET) {
    throw new Error('S3 is not configured')
  }

  const res = await fetch(imageUrl, {
    headers: { 'User-Agent': 'Summitly-Image-Fetch/1.0' },
    next: { revalidate: 0 },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`)
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (buffer.length > maxSize) {
    throw new Error('Image size exceeds 10MB limit')
  }

  let contentType = res.headers.get('content-type')?.split(';')[0]?.trim() || ''
  if (!ALLOWED_IMAGE_TYPES.includes(contentType as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    const ext = imageUrl.split('.').pop()?.toLowerCase()?.replace(/\?.*$/, '') || 'jpg'
    contentType = EXT_TO_TYPE[ext] || 'image/jpeg'
  }

  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const ext = contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1] || 'jpg'
  const filePath = `images/agents/${folder}/${timestamp}-${random}.${ext}`

  return uploadToS3(filePath, buffer, contentType)
}

