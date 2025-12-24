/**
 * Image URL utilities for handling Supabase to S3 migration
 */

// AWS S3 Public URL - using custom domain
const AWS_PUBLIC_URL = 'https://shared-s3.property.ca/public'

/**
 * Convert Supabase storage URL to S3 URL
 * Handles migration from Supabase to S3 for existing data
 * 
 * @param url - Image URL (can be Supabase, S3, or other)
 * @returns Converted S3 URL or original URL if not a Supabase URL
 * 
 * @example
 * convertToS3Url('https://omsefyactufffyqaxowx.supabase.co/storage/v1/object/public/images/pre-con/projects/file.jpg')
 * // Returns: 'https://shared-s3.property.ca/public/images/pre-con/projects/file.jpg'
 */
export function convertToS3Url(url: string | null | undefined): string {
  if (!url) return ''
  
  // Already an AWS S3 URL (either format) - return as is
  if (url.includes('shared-s3.property.ca') || 
      url.includes('s3.amazonaws.com') || 
      url.includes('s3.ca-central-1.amazonaws.com')) {
    return url
  }
  
  // Check if it's a Supabase storage URL
  const supabasePattern = /https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/(images|documents)\/(.+)$/
  const match = url.match(supabasePattern)
  
  if (match) {
    const [, bucket, path] = match
    // Convert to AWS S3 public URL format (using custom domain)
    return `${AWS_PUBLIC_URL}/${bucket}/${path}`
  }
  
  // Return original URL if not a Supabase URL
  return url
}

/**
 * Get S3 public URL for a file path
 * @param bucket - Bucket name ('images' or 'documents')
 * @param filePath - File path within bucket (e.g., 'pre-con/projects/file.jpg')
 * @returns Full S3 public URL
 */
export function getS3ImageUrl(bucket: 'images' | 'documents', filePath: string): string {
  return `${AWS_PUBLIC_URL}/${bucket}/${filePath}`
}

