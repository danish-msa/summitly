"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Bed, Bath, Maximize2, DollarSign, Check } from 'lucide-react'
import { UnitListing } from '@/lib/types/units'

interface UnitDetailPageClientProps {
  unit: UnitListing;
  propertyId: string;
  projectName?: string;
}

const UnitDetailPageClient: React.FC<UnitDetailPageClientProps> = ({ unit, propertyId, projectName }) => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push(`/pre-con/${propertyId}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Project
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Unit {unit.name}
              </h1>
              <p className="text-xl text-muted-foreground">
                {projectName || (propertyId ? propertyId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Pre-Construction Project')}
              </p>
            </div>
            {unit.status === "sold-out" && (
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Sold Out
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Floorplan */}
            <Card>
              <CardHeader>
                <CardTitle>Floorplan{unit.images && unit.images.length > 1 ? `s (${unit.images.length})` : ''}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {unit.images && unit.images.length > 0 ? (
                    unit.images.map((image, index) => (
                      <div key={index} className="bg-muted rounded-lg p-8 flex items-center justify-center">
                        <img
                          src={image}
                          alt={`${unit.name} floorplan ${index + 1}`}
                          className="max-w-full h-auto"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/floorplan-placeholder.jpg';
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="bg-muted rounded-lg p-8 flex items-center justify-center">
                      <img
                        src="/images/floorplan-placeholder.jpg"
                        alt={`${unit.name} floorplan`}
                        className="max-w-full h-auto"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {unit.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About This Unit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {unit.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            {unit.features && unit.features.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {unit.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Amenities */}
            {unit.amenities && unit.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Building Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {unit.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Unit Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bed className="w-5 h-5" />
                    <span>Bedrooms</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {unit.beds === 2 && unit.name.includes("+") ? "2+1" : unit.beds}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bath className="w-5 h-5" />
                    <span>Bathrooms</span>
                  </div>
                  <span className="font-semibold text-foreground">{unit.baths}</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Maximize2 className="w-5 h-5" />
                    <span>Square Feet</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {unit.sqft ? `${unit.sqft} sqft` : "Contact for details"}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="w-5 h-5" />
                    <span>Maint. Fees</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    ${unit.maintenanceFee}/mo
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Card */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div>
                    <p className="text-sm opacity-90 mb-2">Starting From</p>
                    <p className="text-3xl font-bold">
                      {unit.price 
                        ? new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(unit.price)
                        : 'Contact for Pricing'}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="w-full bg-background text-foreground hover:bg-background/90"
                  >
                    Schedule a Viewing
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    Request Info
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Sales Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Have questions? Our sales team is here to help you find your perfect home.
                </p>
                <div className="pt-2">
                  <p className="font-semibold text-foreground">Sales Office</p>
                  <p className="text-muted-foreground">Open Daily 10am - 6pm</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitDetailPageClient;

