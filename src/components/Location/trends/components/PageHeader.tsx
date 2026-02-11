"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Share2, Copy, Mail, CheckIcon, ArrowLeft } from 'lucide-react';
import { 
  FaFacebook, 
  FaTwitter, 
  FaLinkedin, 
  FaWhatsapp
} from "react-icons/fa";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PageHeaderProps {
  cityName: string;
  citySlug: string;
  backLabel?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ cityName, citySlug, backLabel }) => {
  const [copied, setCopied] = useState(false);

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const pageTitle = `${cityName} Market Trends - Housing Market Report`;
  const pageDescription = `Explore housing market statistics, price trends, and market insights for ${cityName}.`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(pageTitle);
    const body = encodeURIComponent(`${pageDescription}\n\nView it here: ${pageUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`${pageDescription}\n\n${pageUrl}`);
    window.open(`https://wa.me/?text=${text}`);
  };

  const shareViaFacebook = () => {
    const url = encodeURIComponent(pageUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(`${pageTitle} - ${pageDescription}`);
    const url = encodeURIComponent(pageUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
  };

  const shareViaLinkedIn = () => {
    const url = encodeURIComponent(pageUrl);
    const title = encodeURIComponent(pageTitle);
    const summary = encodeURIComponent(pageDescription);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`);
  };

  const backUrl = citySlug.startsWith('/') ? citySlug : `/${citySlug}`;
  const backText = backLabel || `Back to ${cityName} Page`;

  return (
    <header className="border-b bg-card pt-16">
      <div className="container-1400 mx-auto px-4 py-6">
        <div className="mb-4">
          <Link href={backUrl}>
            <Button
              variant="ghost"
              className="flex items-center gap-2 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{backText}</span>
            </Button>
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {cityName} Market Trends
            </h1>
            <span className="font-medium">Housing Market Report for November 2025</span>
            <p className="text-muted-foreground mt-4">
              Explore housing market statistics, price trends, and market insights for {cityName}.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="flex items-center gap-2.5 h-11 px-5 rounded-lg border-2 font-medium text-sm shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5" />
                  <span>Copy Link</span>
                </>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2.5 h-11 px-5 rounded-lg border-2 font-medium text-sm shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                >
                  <Share2 className="h-5 w-5" />
                  <span>Share</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-lg shadow-lg border">
                <DropdownMenuItem 
                  onClick={shareViaEmail} 
                  className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Email</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={shareViaWhatsApp} 
                  className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <FaWhatsapp className="h-5 w-5 text-green-600" />
                  <span className="font-medium">WhatsApp</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={shareViaFacebook} 
                  className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <FaFacebook className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Facebook</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={shareViaTwitter} 
                  className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <FaTwitter className="h-5 w-5 text-sky-500" />
                  <span className="font-medium">Twitter</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={shareViaLinkedIn} 
                  className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <FaLinkedin className="h-5 w-5 text-blue-700" />
                  <span className="font-medium">LinkedIn</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

