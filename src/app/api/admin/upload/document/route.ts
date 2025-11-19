import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/roles'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isAdmin(session.user.role)) {
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

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase Storage
    const filePath = `pre-con/${fileName}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: `Failed to upload document: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    const publicPath = urlData.publicUrl

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

