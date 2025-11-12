import React, { useState } from 'react';
import { 
  Copy, 
  Mail, 
  CheckIcon
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
import { PropertyListing } from '@/lib/types';

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

  const shareOptions = [
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
      action: () => shareViaEmail()
    },
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      color: 'bg-green-100 hover:bg-green-200 text-green-700',
      action: () => shareViaWhatsApp()
    },
    {
      name: 'Facebook',
      icon: FaFacebook,
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
      action: () => shareViaFacebook()
    },
    {
      name: 'Twitter',
      icon: FaTwitter,
      color: 'bg-sky-500 hover:bg-sky-600 text-white',
      action: () => shareViaTwitter()
    },
    {
      name: 'Pinterest',
      icon: FaPinterest,
      color: 'bg-red-600 hover:bg-red-700 text-white',
      action: () => shareViaPinterest()
    },
    {
      name: 'Reddit',
      icon: FaReddit,
      color: 'bg-orange-500 hover:bg-orange-600 text-white',
      action: () => shareViaReddit()
    },
    {
      name: 'LinkedIn',
      icon: FaLinkedin,
      color: 'bg-blue-700 hover:bg-blue-800 text-white',
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
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Share Property</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Info */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Sharing:</h3>
            <p className="font-semibold text-sm">{propertyTitle}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {property.details.numBedrooms} bed • {property.details.numBathrooms} bath
            </p>
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
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
          <div className="space-y-3">
            <Label className="text-sm font-medium">Share on:</Label>
            <div className="flex flex-wrap items-center gap-3">
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
