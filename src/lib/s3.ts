import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

/**
 * AWS S3 Client Configuration
 * 
 * Uses environment variables:
 * - AWS_ACCESS_KEY_ID: AWS access key
 * - AWS_SECRET_ACCESS_KEY: AWS secret key
 * - AWS_REGION: AWS region (default: ca-central-1)
 * - AWS_S3_BUCKET: S3 bucket name (default: summitly-storage)
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ca-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'summitly-storage'
const REGION = process.env.AWS_REGION || 'ca-central-1'
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
      // Note: ACL is disabled on this bucket, so we rely on bucket policy for public access
    })

    await s3Client.send(command)

    // Return public URL using custom domain
    return `${AWS_PUBLIC_URL}/${filePath}`
  } catch (error) {
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
  const legacyPattern = /https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/(images|documents)\/(.+)$/
  const match = url.match(legacyPattern)
  
  if (match) {
    const [, bucket, path] = match
    // Convert to S3 URL format
    return getS3PublicUrl(`${bucket}/${path}`)
  }
  
  // Return original URL if not a legacy storage URL
  return url
}

