import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api/auth-utils'
import { isAdmin } from '@/lib/roles'
import { uploadToS3 } from '@/lib/s3'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request)
    
    if (!auth?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isAdmin(auth.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const projectName = formData.get('projectName') as string | null
    const docType = formData.get('docType') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type - allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, TXT, JPEG, PNG are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 20MB for documents)
    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 20MB limit.' },
        { status: 400 }
      )
    }

    // Generate filename in format: {project_name}-{doc_type}.{extension}
    const sanitizeName = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        .substring(0, 50) // Limit length
    }
    
    const sanitizedProjectName = projectName ? sanitizeName(projectName) : 'project'
    const sanitizedDocType = docType ? sanitizeName(docType) : 'document'
    const fileExtension = file.name.split('.').pop() || 'pdf'
    
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now()
    const fileName = `${sanitizedProjectName}-${sanitizedDocType}-${timestamp}.${fileExtension}`

    // Validate AWS S3 configuration
    if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'AWS S3 is not configured. Please set S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY environment variables.' },
        { status: 500 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to AWS S3
    const filePath = `documents/pre-con/${fileName}`
    const publicPath = await uploadToS3(filePath, buffer, file.type)

    return NextResponse.json({
      success: true,
      path: publicPath,
      fileName,
    })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}

