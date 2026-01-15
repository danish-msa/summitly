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

const Documents: React.FC<DocumentsProps> = ({ property, rawProperty }) => {
  // Get documents from preCon data
  const documents = property.preCon?.documents || []
  
  // If no documents, return null (component won't render)
  if (!documents || documents.length === 0) {
    return null
  }

  const handleDownload = (url: string, name: string) => {
    // Open document in new tab for download
    if (url && url !== '#') {
      window.open(url, '_blank')
    }
  }

  // Helper function to get document type description
  const getDocumentTypeDescription = (type: string): string => {
    const typeMap: Record<string, string> = {
      brochure: 'Project brochure with detailed information about the development.',
      floorplan: 'Floor plan showing unit layouts and dimensions.',
      specification: 'Technical specifications and building details.',
      contract: 'Contract or agreement document.',
      other: 'Additional project document.'
    }
    return typeMap[type] || 'Project document.'
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg px-10">
        <h2 className="text-2xl font-semibold text-foreground mb-6">Documents</h2>
        <div className="divide-y divide-gray-200">
          {documents.map((document) => (
            <div key={document.id} className="flex items-start justify-between py-4 first:pt-0 last:pb-0">
              {/* Left side: Icon and Text */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">
                    {document.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getDocumentTypeDescription(document.type)}
                    {document.size && ` • ${document.size}`}
                  </p>
                </div>
              </div>
              
              {/* Right side: Download link */}
              <div className="flex-shrink-0 ml-4">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleDownload(document.url, document.name)}
                  className="bg-secondary rounded-lg hover:bg-secondary/90 text-white text-xs transition-colors"
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
