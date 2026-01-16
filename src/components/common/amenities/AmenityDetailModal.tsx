"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Star,
  Clock,
  Navigation,
  Phone,
  MapPin,
  Share2,
  Bookmark,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Amenity } from "./types";

interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  helpful: number;
}

interface AmenityDetail {
  id: string;
  name: string;
  category: string;
  address: string;
  distance: string;
  walkTime: string;
  rating: number;
  totalReviews: number;
  priceLevel?: string;
  isOpen: boolean;
  hours: { day: string; hours: string }[];
  phone?: string;
  website?: string;
  description: string;
  features: string[];
  photos: string[];
  reviews: Review[];
}

interface AmenityDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amenity: Amenity | null;
  categoryId: string;
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            star <= Math.floor(rating)
              ? "fill-yellow-400 text-yellow-400"
              : star - 0.5 <= rating
              ? "fill-yellow-400/50 text-yellow-400"
              : "fill-muted text-muted"
          )}
        />
      ))}
    </div>
  );
}

export function AmenityDetailModal({ open, onOpenChange, amenity, categoryId: _categoryId }: AmenityDetailModalProps) {
  const [detail, setDetail] = useState<AmenityDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && amenity) {
      fetchAmenityDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, amenity]);

  const fetchAmenityDetails = async () => {
    if (!amenity) return;

    setLoading(true);
    try {
      // Fetch detailed information from Google Places API
      const response = await fetch(
        `/api/amenity-details?placeId=${amenity.id}&lat=${amenity.latitude}&lng=${amenity.longitude}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch amenity details");
      }

      const data = await response.json();
      setDetail(data);
    } catch (error) {
      console.error("Error fetching amenity details:", error);
      // Fallback to basic info from amenity
      setDetail({
        id: amenity.id,
        name: amenity.name,
        category: amenity.type,
        address: amenity.name, // Will be updated by API
        distance: amenity.distance,
        walkTime: amenity.walkTime,
        rating: amenity.rating || 0,
        totalReviews: 0,
        isOpen: true,
        hours: [],
        description: `${amenity.type} located ${amenity.distance} away.`,
        features: [],
        photos: [],
        reviews: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (!amenity) return null;

  const _today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  // const todayHours = detail?.hours.find((h) => h.day === today);

  const getDirectionsUrl = () => {
    if (amenity.latitude && amenity.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${amenity.latitude},${amenity.longitude}`;
    }
    return null;
  };

  const handleDirections = () => {
    const url = getDirectionsUrl();
    if (url) {
      window.open(url, "_blank");
    }
  };

  const handleCall = () => {
    if (detail?.phone) {
      window.location.href = `tel:${detail.phone}`;
    }
  };

  const handleShare = async () => {
    if (navigator.share && detail) {
      try {
        await navigator.share({
          title: detail.name,
          text: detail.description,
          url: getDirectionsUrl() || window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    }
  };

  const displayDetail = detail || {
    id: amenity.id,
    name: amenity.name,
    category: amenity.type,
    address: amenity.name,
    distance: amenity.distance,
    walkTime: amenity.walkTime,
    rating: amenity.rating || 0,
    totalReviews: 0,
    isOpen: true,
    hours: [],
    description: `${amenity.type} located ${amenity.distance} away.`,
    features: [],
    photos: [],
    reviews: [],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden max-h-[90vh]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-sm text-gray-600">Loading details...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Photo Placeholder */}
            <div className="relative h-48 bg-teal-100 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {displayDetail.photos.length > 0 ? (
                  <img
                    src={displayDetail.photos[0]}
                    alt={displayDetail.name}
                    className="w-full h-full object-cover"
                  />
                </>
              ) : (
                <span className="text-sm text-gray-500">Main photo</span>
              )}
              {/* Action buttons overlay */}
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={handleShare}
                  className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                >
                  <Share2 className="w-4 h-4 text-gray-700" />
                </button>
                <button className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors">
                  <Bookmark className="w-4 h-4 text-gray-700" />
                </button>
              </div>
            </div>

            <ScrollArea className="max-h-[calc(90vh-12rem)]">
              <div className="p-5 space-y-4">
                {/* Header */}
                <div>
                  <DialogHeader className="p-0">
                    <DialogTitle className="text-2xl font-bold leading-tight mb-2">{displayDetail.name}</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center gap-2 mb-1">
                    {displayDetail.rating > 0 && (
                      <>
                        <span className="font-semibold text-base">{displayDetail.rating.toFixed(1)}</span>
                        <StarRating rating={displayDetail.rating} />
                        {displayDetail.totalReviews > 0 && (
                          <span className="text-sm text-gray-600">({displayDetail.totalReviews})</span>
                        )}
                        {displayDetail.priceLevel && (
                          <>
                            <span className="text-gray-400">·</span>
                            <span className="text-sm text-gray-600">{displayDetail.priceLevel}</span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{displayDetail.category}</p>
                </div>

                {/* Quick Info Badges */}
                <div className="flex flex-wrap gap-2">
                  {displayDetail.hours.length > 0 && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1.5 px-3 py-1",
                        displayDetail.isOpen
                          ? "border-green-500/30 text-green-600 bg-green-50"
                          : "border-red-500/30 text-red-600 bg-red-50"
                      )}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {displayDetail.isOpen ? "Open now" : "Closed"}
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1.5 px-3 py-1 bg-gray-50">
                    <Navigation className="w-3.5 h-3.5" />
                    {displayDetail.walkTime}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">{displayDetail.description}</p>

                {/* Features */}
                {displayDetail.features.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {displayDetail.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs font-normal px-2.5 py-1 bg-gray-100 text-gray-700">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Contact & Location */}
                <div className="space-y-1">
                  <button
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    onClick={handleDirections}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{displayDetail.address}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{displayDetail.distance} away</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  {displayDetail.phone && (
                    <button
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      onClick={handleCall}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-gray-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">{displayDetail.phone}</p>
                      <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                    </button>
                  )}
                </div>

                {/* Maps Link */}
                <div className="pt-2">
                  <button
                    onClick={handleDirections}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <span>→ Maps</span>
                  </button>
                </div>
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

