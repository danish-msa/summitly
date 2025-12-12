import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, Linkedin, MapPin, Phone, Mail } from "lucide-react"

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const Footer = () => {
  return (
    <footer className="w-full bg-white">
      {/* Main Footer */}
      <div className="container-1400 mx-auto py-8 px-4 md:px-8">
        <div className="">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
            {/* Logo & Social */}
            <div className="flex flex-col gap-4 w-full lg:w-[30%]">
              <Link href="/" className="flex items-center">
                <Image 
                  src="/images/logo/summitly_logo.png" 
                  alt="Summitly Logo" 
                  width={120} 
                  height={40}
                  className="w-auto h-12"
                  priority
                />
              </Link>
              <p className="text-sm text-muted-foreground">
                Your trusted partner in real estate. We help you find your perfect home, make informed decisions, and connect with expert real estate professionals across Canada.
              </p>
              <div className="flex items-center gap-4">
                <a 
                  href="https://www.facebook.com/Summitlycanada" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-brand-red hover:scale-110 transition-colors" 
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a 
                  href="https://www.instagram.com/summitlycanada" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-brand-red hover:scale-110 transition-colors" 
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a 
                  href="https://x.com/summitlycanada" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-brand-red hover:scale-110 transition-colors" 
                  aria-label="X"
                >
                  <XIcon />
                </a>
                <a 
                  href="https://www.linkedin.com/company/summitlycanada" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-brand-red hover:scale-110 transition-colors" 
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Info Section */}
            <div className="flex flex-col gap-3 text-sm w-full lg:w-[50%] border-l pl-8">
              <div className="flex flex-col gap-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>310-3100 Steeles Ave W, Vaughan, ON, L4K 3R1</span>
                </div>
                <a href="tel:+15551234567" className="flex items-center gap-2 hover:text-brand-red transition-colors">
                  <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>+1 (555) 123-4567</span>
                </a>
                <a href="mailto:info@summitly.com" className="flex items-center gap-2 hover:text-brand-red transition-colors">
                  <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>info@summitly.com</span>
                </a>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <Link href="/privacy-policy" className="hover:text-brand-red transition-colors">
                  Privacy policy
                </Link>
                <span className="text-border">|</span>
                <Link href="/terms" className="hover:text-brand-red transition-colors">
                  Terms of Use
                </Link>
              </div>
            </div>

            {/* Quick Links Section */}
            <div className="flex flex-col gap-3 w-full lg:w-[20%]">
              <p className="text-sm font-semibold text-foreground">Quick Links</p>
              <nav className="flex flex-col gap-2">
                <Link href="/about" className="text-sm text-muted-foreground hover:text-brand-red transition-colors">
                  About Us
                </Link>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-brand-red transition-colors">
                  Contact Us
                </Link>
                <Link href="/faqs" className="text-sm text-muted-foreground hover:text-brand-red transition-colors">
                  FAQs
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-muted/50 py-6 px-4 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-muted-foreground leading-relaxed text-center">
            For listings in Canada, the trademarks REALTOR®, REALTORS®, and the REALTOR® logo are controlled by The Canadian Real Estate Association (CREA) and identify real estate professionals who are members of CREA. The trademarks MLS®, Multiple Listing Service® and the associated logos are owned by CREA and identify the quality of services provided by real estate professionals who are members of CREA. Used under license.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed text-center mt-4">
            ©2025 Summitly. ALL RIGHTS RESERVED
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
