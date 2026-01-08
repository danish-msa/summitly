/**
 * Fix S3 Object Permissions
 * 
 * This script sets public-read ACL on all images in S3 to make them accessible
 */

import { S3Client, PutObjectAclCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ca-central-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.S3_BUCKET || 'summitly-storage'

async function fixObjectPermissions(key: string): Promise<boolean> {
  try {
    await s3Client.send(new PutObjectAclCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ACL: 'public-read',
    }))
    return true
  } catch (error) {
    console.error(`  ❌ Failed to fix ${key}:`, error instanceof Error ? error.message : error)
    return false
  }
}

async function listAllImages(): Promise<string[]> {
  const images: string[] = []
  let continuationToken: string | undefined

  console.log('📁 Listing all images in S3...\n')

  do {
    try {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: 'images/',
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      })

      const response = await s3Client.send(command)

      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key && (object.Key.endsWith('.jpg') || object.Key.endsWith('.jpeg') || 
              object.Key.endsWith('.png') || object.Key.endsWith('.webp') || object.Key.endsWith('.gif'))) {
            images.push(object.Key)
          }
        }
      }

      continuationToken = response.NextContinuationToken
    } catch (error) {
      console.error('Error listing objects:', error)
      break
    }
  } while (continuationToken)

  return images
}

async function main() {
  console.log('🔧 Fixing S3 Object Permissions\n')
  console.log('This will set public-read ACL on all images in S3\n')

  const images = await listAllImages()
  console.log(`Found ${images.length} images to fix\n`)

  if (images.length === 0) {
    console.log('No images found. Exiting.')
    return
  }

  let successCount = 0
  let failCount = 0

  // Process in batches of 10
  for (let i = 0; i < images.length; i += 10) {
    const batch = images.slice(i, i + 10)
    const results = await Promise.all(
      batch.map(async (key) => {
        const success = await fixObjectPermissions(key)
        if (success) {
          console.log(`  ✅ Fixed: ${key.substring(0, 80)}...`)
        }
        return success
      })
    )

    successCount += results.filter(r => r).length
    failCount += results.filter(r => !r).length

    // Progress update
    const processed = Math.min(i + 10, images.length)
    console.log(`\nProgress: ${processed}/${images.length} images processed\n`)
  }

  console.log(`\n📊 Summary:`)
  console.log(`  ✅ Fixed: ${successCount}`)
  console.log(`  ❌ Failed: ${failCount}`)
  console.log(`\n✨ Done! Images should now be publicly accessible.`)
}

main()

