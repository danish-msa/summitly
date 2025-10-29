import React, { useState } from 'react';
import { 
  Copy, 
  Mail, 
  MessageCircle, 
  Facebook, 
  Twitter, 
  Bookmark, 
  MessageSquare, 
  Linkedin,
  CheckIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
      name: 'Copy Link',
      icon: Copy,
      action: () => copyToClipboard()
    },
    {
      name: 'Email',
      icon: Mail,
      action: () => shareViaEmail()
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      action: () => shareViaWhatsApp()
    },
    {
      name: 'Facebook',
      icon: Facebook,
      action: () => shareViaFacebook()
    },
    {
      name: 'Twitter',
      icon: Twitter,
      action: () => shareViaTwitter()
    },
    {
      name: 'Pinterest',
      icon: Bookmark,
      action: () => shareViaPinterest()
    },
    {
      name: 'Reddit',
      icon: MessageSquare,
      action: () => shareViaReddit()
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
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
      <DialogContent className="max-w-md">
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

          {/* Share Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Share on:</Label>
            <div className="grid grid-cols-3 gap-2">
              {shareOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <Button
                    key={option.name}
                    variant="outline"
                    className="py-1 px-3 h-9 rounded-lg"
                    onClick={option.action}
                  >
                    <IconComponent className="h-3 w-3" />
                    <span className="text-xs font-medium">{option.name}</span>
                    {option.name === 'Copy Link' && copied && (
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    )}
                    </Button>
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
