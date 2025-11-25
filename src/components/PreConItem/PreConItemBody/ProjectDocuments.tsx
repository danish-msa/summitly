"use client";

import React from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { PropertyListing } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ProjectDocumentsProps {
  property: PropertyListing;
}

interface Document {
  id: string;
  name: string;
  url: string;
  type: string; // 'brochure', 'floorplan', 'specification', 'contract', 'other'
  size?: string;
  uploadedDate?: string;
}

const ProjectDocuments: React.FC<ProjectDocumentsProps> = ({ property }) => {
  // Get documents from preCon data
  const documents: Document[] = property.preCon?.documents || [];

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No documents available for this project.</p>
      </div>
    );
  }

  // Group documents by type
  const documentsByType = documents.reduce((acc, doc) => {
    const type = doc.type || 'other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  const typeLabels: Record<string, string> = {
    brochure: 'Brochures',
    floorplan: 'Floor Plans',
    specification: 'Specifications',
    contract: 'Contracts & Agreements',
    other: 'Other Documents'
  };

  const getTypeIcon = () => {
    return <FileText className="h-5 w-5" />;
  };

  const handleDownload = (url: string) => {
    // Open in new tab for download
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-2">
      {Object.entries(documentsByType).map(([type, docs]) => (
        <div key={type} className="space-y-2">
          
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          {/* <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
            {getTypeIcon()}
            {typeLabels[type] || 'Documents'}
          </h4> */}
            {docs.map((doc) => (
              <Card key={doc.id} className="p-2 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-1">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex gap-4 min-w-0 items-center flex-1">
                      <span className="font-medium flex-1 text-foreground line-clamp-2">
                        {doc.name}
                      </span>
                      {doc.size && (
                        <p className="text-xs text-muted-foreground">
                          {doc.size}
                        </p>
                      )}
                      {doc.uploadedDate && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.uploadedDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleDownload(doc.url)}
                      className="flex items-center gap-2 "
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(doc.url, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">Open in new tab</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectDocuments;

