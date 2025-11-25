"use client"

import React, { useState } from 'react'
import { PropertyListing } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import RequestFurtherInfoModal from './RequestFurtherInfoModal'

interface RightSidebarProps {
  property: PropertyListing
}

const RightSidebar: React.FC<RightSidebarProps> = ({ property }) => {
  const [isRequestInfoModalOpen, setIsRequestInfoModalOpen] = useState(false)

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Request Further Info CTA */}
      <Card className="border border-border">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                Need More Information?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get detailed information about this project, pricing, floor plans, and more.
              </p>
            </div>
            
            <Button 
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold"
              size="lg"
              onClick={() => setIsRequestInfoModalOpen(true)}
            >
              Request Further Info
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CTA Block */}
      <Card className="bg-gradient-to-r from-brand-celestial to-brand-cb-blue text-primary-foreground">
        <CardContent className="px-4 py-6">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">
                Why wait in Line?
              </h3>
              <h4 className="text-base font-semibold">
                Get {property.preCon?.projectName || 'Project'} Latest Info
              </h4>
            </div>
            
            <Button 
              className="w-full bg-background text-foreground hover:text-white font-semibold"
              size="lg"
              onClick={() => setIsRequestInfoModalOpen(true)}
            >
              Get First Access
            </Button>
            
            <div className="space-y-2 pt-2 border-t border-primary-foreground/20">
              <p className="text-sm leading-relaxed">
                {property.preCon?.projectName || 'This project'} is one of the townhome homes in Calgary by {property.preCon?.developer || 'the developer'}
              </p>
              <p className="text-sm">
                Browse our curated guides for buyers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Further Info Modal */}
      <RequestFurtherInfoModal
        open={isRequestInfoModalOpen}
        onOpenChange={setIsRequestInfoModalOpen}
        projectName={property.preCon?.projectName}
      />
    </div>
  )
}

export default RightSidebar

