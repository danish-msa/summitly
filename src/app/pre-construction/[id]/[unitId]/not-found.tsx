import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Building2, ArrowLeft, HomeIcon } from 'lucide-react';

export default function UnitNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 Number */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <HomeIcon className="h-24 w-24 text-primary/20" />
          </div>
          <h1 className="text-6xl font-bold text-primary/20">404</h1>
          <h2 className="text-3xl font-bold text-foreground">Unit Not Found</h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            The unit you're looking for doesn't exist or may have been sold out.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button
            asChild
            size="lg"
            variant="outline"
            onClick={() => window.history.back()}
          >
            <Link href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Project
            </Link>
          </Button>
          
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Link href="/pre-construction">
              <Building2 className="mr-2 h-5 w-5" />
              Browse All Projects
            </Link>
          </Button>
        </div>

        {/* Quick Links */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">Explore More:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
            >
              <Link href="/pre-construction">
                Pre-Construction Projects
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
            >
              <Link href="/listings">
                Property Listings
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

