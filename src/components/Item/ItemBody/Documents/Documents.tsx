"use client"

import React from 'react'
import { FileText } from 'lucide-react'
import { PropertyListing } from '@/lib/types'
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing'
import { Button } from '@/components/ui/button'

interface DocumentsProps {
  property: PropertyListing
  rawProperty?: SinglePropertyListingResponse | null
}

interface DocumentItem {
  title: string
  description: string
  downloadUrl?: string
}

const Documents: React.FC<DocumentsProps> = ({ property, rawProperty }) => {
  // Document items - can be populated from property data later
  const documentItems: DocumentItem[] = [
    {
      title: 'Last Transfer Document',
      description: 'The most recent deed or transfer document showing ownership changes for this property.',
      downloadUrl: '#'
    },
    {
      title: 'Last Finance Document',
      description: 'The most recent mortgage or financing document associated with this property.',
      downloadUrl: '#'
    },
    {
      title: 'Assessor Map',
      description: 'Official assessor map showing property boundaries, lot lines, and assessment information.',
      downloadUrl: '#'
    }
  ]

  const handleDownload = (url: string, title: string) => {
    // Handle download logic here
    console.log(`Downloading ${title}: ${url}`)
    // You can implement actual download logic here
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg px-10">
        <h2 className="text-2xl font-semibold text-foreground mb-6">Documents</h2>
        <div className="divide-y divide-gray-200">
          {documentItems.map((document, index) => (
            <div key={index} className="flex items-start justify-between py-4 first:pt-0 last:pb-0">
              {/* Left side: Icon and Text */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">
                    {document.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {document.description}
                  </p>
                </div>
              </div>
              
              {/* Right side: Download link */}
              <div className="flex-shrink-0 ml-4">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleDownload(document.downloadUrl || '#', document.title)}
                  className=" bg-secondary rounded-lg hover:bg-secondary/90 text-white text-xs transition-colors"
                >
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Documents
