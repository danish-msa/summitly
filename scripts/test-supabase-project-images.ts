/**
 * Test if Supabase project images are accessible
 */

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

// Sample image URLs from the check
const sampleImages = [
  'https://shared-s3.property.ca/public/images/buildings/15011/2-post-road-2-post-rd-original-6925e559e',
  'https://shared-s3.property.ca/public/images/buildings/13430/above-condos-30-bristol-rd-e-44-bristol-',
  'https://shared-s3.property.ca/public/images/buildings/13925/freed-hotel-residences-240-adelaide-st-w',
]

async function testImageAccess(url: string): Promise<{ accessible: boolean; status?: number; error?: string }> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return {
      accessible: response.ok,
      status: response.status,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    }
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

async function main() {
  console.log('🔍 Testing Image Accessibility\n')
  console.log('Testing sample images from the 16 projects...\n')

  for (const url of sampleImages) {
    console.log(`Testing: ${url.substring(0, 80)}...`)
    const result = await testImageAccess(url)
    if (result.accessible) {
      console.log(`  ✅ ACCESSIBLE (HTTP ${result.status})`)
    } else {
      console.log(`  ❌ NOT ACCESSIBLE: ${result.error}`)
    }
    console.log('')
  }

  console.log('\n💡 Solution:')
  console.log('   The images exist in S3 but are returning 403 Forbidden.')
  console.log('   You need to add a bucket policy to make them publicly accessible.')
  console.log('   See: S3_PERMISSIONS_FIX.md')
}

main()

