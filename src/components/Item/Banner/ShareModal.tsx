import React, { useState } from 'react';
import { 
  Copy, 
  Mail, 
  CheckIcon,
  Bed,
  Bath,
  Maximize2,
  MapPin
} from "lucide-react";
import { 
  FaFacebook, 
  FaTwitter, 
  FaLinkedin, 
  FaPinterest, 
  FaReddit,
  FaWhatsapp
} from "react-icons/fa";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PropertyListing } from '@/lib/types';
import { Share } from 'lucide-react';
import Image from 'next/image';
interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyListing;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, property }) => {
  const [copied, setCopied] = useState(false);
  
  // Generate the property URL (you can customize this based on your routing)
  const propertyUrl = typeof window !== 'undefined' ? window.location.href : '';
  const propertyTitle = `${property.details.propertyType} in ${property.address.city || 'Unknown Location'}`;
  const propertyDescription = `Check out this ${property.details.propertyType} in ${property.address.city}. ${property.details.numBedrooms} bedrooms, ${property.details.numBathrooms} bathrooms.`;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const propertyImage = property?.images?.imageUrl || property?.images?.allImages?.[0] || '';
  const propertyPrice = property?.listPrice || 0;
  const propertyAddress = property?.address?.location || '';
  const bedrooms = property?.details?.numBedrooms || 0;
  const bathrooms = property?.details?.numBathrooms || 0;
  const sqft = property?.details?.sqft || property?.lot?.squareFeet || 0;
  const isRental = property?.type === 'Lease' || property?.type?.toLowerCase().includes('lease');
  const propertyTypeTitle = `${property.details.propertyType} in ${property.address.city || 'Unknown Location'}`;

  const shareOptions = [
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-blue-50 hover:bg-blue-200 text-blue-700',
      action: () => shareViaEmail()
    },
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      color: 'bg-green-50 hover:bg-green-200 text-green-700',
      action: () => shareViaWhatsApp()
    },
    {
      name: 'Facebook',
      icon: FaFacebook,
      color: 'bg-blue-50 hover:bg-blue-200 text-blue-700',
      action: () => shareViaFacebook()
    },
    {
      name: 'Twitter',
      icon: FaTwitter,
      color: 'bg-sky-50 hover:bg-sky-200 text-sky-700',
      action: () => shareViaTwitter()
    },
    {
      name: 'Pinterest',
      icon: FaPinterest,
      color: 'bg-red-50 hover:bg-red-200 text-red-700',
      action: () => shareViaPinterest()
    },
    {
      name: 'Reddit',
      icon: FaReddit,
      color: 'bg-orange-50 hover:bg-orange-200 text-orange-700',
      action: () => shareViaReddit()
    },
    {
      name: 'LinkedIn',
      icon: FaLinkedin,
      color: 'bg-blue-50 hover:bg-blue-200 text-blue-700',
      action: () => shareViaLinkedIn()
    }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(propertyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out this property: ${propertyTitle}`);
    const body = encodeURIComponent(`${propertyDescription}\n\nView it here: ${propertyUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`${propertyDescription}\n\n${propertyUrl}`);
    window.open(`https://wa.me/?text=${text}`);
  };

  const shareViaFacebook = () => {
    const url = encodeURIComponent(propertyUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(`${propertyTitle} - ${propertyDescription}`);
    const url = encodeURIComponent(propertyUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
  };

  const shareViaPinterest = () => {
    const url = encodeURIComponent(propertyUrl);
    const description = encodeURIComponent(propertyDescription);
    const media = property.images.imageUrl ? encodeURIComponent(property.images.imageUrl) : '';
    window.open(`https://pinterest.com/pin/create/button/?url=${url}&description=${description}&media=${media}`);
  };

  const shareViaReddit = () => {
    const title = encodeURIComponent(propertyTitle);
    const url = encodeURIComponent(propertyUrl);
    window.open(`https://reddit.com/submit?title=${title}&url=${url}`);
  };

  const shareViaLinkedIn = () => {
    const url = encodeURIComponent(propertyUrl);
    const title = encodeURIComponent(propertyTitle);
    const summary = encodeURIComponent(propertyDescription);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex gap-2 items-center">
            <span className="bg-secondary rounded-xl p-2 shadow-lg">
              <Share className="h-6 w-6 text-white" />
            </span>
            <span className="text-xl font-semibold">Share Property</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Overview */}
          <div className="border rounded-lg p-4 bg-muted/20">
            <div className="flex gap-4">
              {propertyImage && (
                <div className="relative w-32 flex-shrink-0 rounded-lg overflow-hidden">
                  <Image
                    src={propertyImage}
                    alt="Property"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="mb-2">
                  {isRental ? (
                    <Badge variant="secondary" className="text-xs py-1">
                      For Rent
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs py-1">
                      For Sale
                    </Badge>
                  )}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  {propertyTypeTitle}
                </h3>
                {propertyAddress && (
                  <div className="flex items-start gap-1.5 text-xs text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    <span className="text-xs">{propertyAddress}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  {bedrooms > 0 && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <Bed className="h-4 w-4 text-gray-400" />
                        <span>{bedrooms} {bedrooms === 1 ? 'Bed' : 'Beds'}</span>
                      </div>
                      {bathrooms > 0 && (
                        <>
                          <div className="w-px h-4 bg-gray-300" />
                          <div className="flex items-center gap-1.5">
                            <Bath className="h-4 w-4 text-gray-400" />
                            <span>{bathrooms} {bathrooms === 1 ? 'Bath' : 'Baths'}</span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {bedrooms === 0 && bathrooms > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Bath className="h-4 w-4 text-gray-400" />
                      <span>{bathrooms} {bathrooms === 1 ? 'Bath' : 'Baths'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Copy Link */}
          <div className="space-y-2 flex items-center text-center justify-center gap-2 border rounded-lg p-4">
            <button
              onClick={copyToClipboard}
              className={`flex items-center gap-3 w-full transition-all duration-200 ${
                copied 
                  ? 'border-green-200 text-green-700' 
                  : 'text-gray-700'
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                copied 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {copied ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </div>
              <span className="font-medium text-sm">
                {copied ? 'Link Copied!' : 'Copy Link'}
              </span>
            </button>
          </div>

          {/* Share Options */}
          <div className="space-y-3 text-center">
            <Label className="text-sm font-medium">Share on:</Label>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {shareOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.name}
                    onClick={option.action}
                    title={option.name}
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${option.color} hover:scale-110`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
        </div>
    </div>
    </DialogContent>
    </Dialog>
    );
    };
    export default ShareModal;
