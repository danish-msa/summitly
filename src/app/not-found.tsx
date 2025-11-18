import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search, ArrowLeft, Building2 } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 Number */}
        <div className="space-y-4">
          <h1 className="text-9xl font-bold text-primary/20">404</h1>
          <h2 className="text-4xl font-bold text-foreground">Page Not Found</h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or the URL might be incorrect.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Go Home
            </Link>
          </Button>
          
          <Button
            asChild
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
          >
            <Link href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </Link>
          </Button>
        </div>

        {/* Quick Links */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">Popular Pages:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
            >
              <Link href="/listings">
                <Search className="mr-2 h-4 w-4" />
                Browse Listings
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
            >
              <Link href="/pre-construction">
                <Building2 className="mr-2 h-4 w-4" />
                Pre-Construction
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
            >
              <Link href="/map-search">
                <Search className="mr-2 h-4 w-4" />
                Map Search
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

