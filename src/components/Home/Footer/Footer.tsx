import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, Linkedin, MapPin, Phone, Mail } from "lucide-react"
import ContactMethods from "../ContactMethods/ContactMethods"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5 fill-current" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const Footer = () => {
  const [email, setEmail] = useState('')

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle newsletter subscription
    console.log('Newsletter subscription:', email)
    setEmail('')
  }

  return (
    <>
    <ContactMethods />
    <footer className="hidden md:block w-full bg-footer">
      {/* Main Footer */}
      <div className="container-1400 mx-auto py-6 sm:py-16 px-4 sm:px-6 md:px-8">
        <div className="">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6 sm:gap-8">
            {/* Logo & Social */}
            <div className="flex flex-col gap-3 sm:gap-4 w-full lg:w-[28%] lg:max-w-[350px]">
              <Link href="/" className="flex">
                <Image 
                  src="/images/logo/summitly_logo_white.png" 
                  alt="Summitly Logo" 
                  width={120} 
                  height={40}
                  className="w-auto h-10"
                  priority
                />
              </Link>
              <p className="text-xs font-light text-white leading-relaxed">
                Your trusted partner in real estate. We help you find your perfect home, make informed decisions, and connect with expert real estate professionals across Canada.
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <a 
                  href="https://www.facebook.com/Summitlycanada" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-brand-red hover:scale-110 transition-colors" 
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </a>
                <a 
                  href="https://www.instagram.com/summitlycanada" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-brand-red hover:scale-110 transition-colors" 
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </a>
                <a 
                  href="https://x.com/summitlycanada" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-brand-red hover:scale-110 transition-colors" 
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
                  <Linkedin className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </a>
              </div>
            </div>

            {/* Quick Links Column */}
            <div className="flex flex-col gap-3 sm:gap-4 w-full lg:w-[22%] lg:max-w-[180px]">
              <h3 className="text-sm sm:text-base font-bold text-white">Quick Links</h3>
              <nav className="flex flex-col gap-2 sm:gap-3">
                <Link href="/about" className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">
                  About Us
                </Link>
                <Link href="/contact" className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">
                  Contact Us
                </Link>
                <Link href="/faqs" className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">
                  FAQs
                </Link>
                <Link href="/privacy-policy" className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">
                  Terms of Use
                </Link>
              </nav>
            </div>

            {/* Contact Column */}
            <div className="flex flex-col gap-3 sm:gap-4 w-full lg:w-[25%] lg:max-w-[250px]">
              <h3 className="text-sm sm:text-base font-bold text-white">Contact</h3>
              <div className="flex flex-col gap-2 sm:gap-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-white/90 flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col text-xs sm:text-sm text-white/50 leading-relaxed">
                    <span>310-3100 Steeles Ave W</span>
                    <span>Vaughan, ON, L4K 3R1</span>
                  </div>
                </div>
                <a href="tel:+15551234567" className="flex items-center gap-2 text-xs sm:text-sm text-white/50 hover:text-white transition-colors">
                  <Phone className="h-4 w-4 text-white/90 flex-shrink-0" />
                  <span>+1 (555) 123-4567</span>
                </a>
                <a href="mailto:info@summitly.com" className="flex items-center gap-2 text-xs sm:text-sm text-white/50 hover:text-white transition-colors">
                  <Mail className="h-4 w-4 text-white/90 flex-shrink-0" />
                  <span>info@summitly.com</span>
                </a>
              </div>
            </div>

            {/* Newsletter Column */}
            <div className="flex flex-col gap-3 sm:gap-4 w-full lg:w-[25%] lg:max-w-[280px]">
              <h3 className="text-sm sm:text-base font-bold text-white">Newsletter</h3>
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
                Subscribe to get the latest property updates.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 h-10 px-3 text-xs sm:text-sm bg-white/10 border border-white/20 text-white placeholder:text-white/60 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                />
                <Button
                  type="submit"
                  className="h-10 px-4 sm:px-6 bg-secondary hover:bg-secondary/90 text-white rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap"
                >
                  Go
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* Disclaimer */}
      <div className="py-4 sm:py-6 px-4 sm:px-6 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] font-light sm:text-xs text-white/50 leading-relaxed text-center">
            For listings in Canada, the trademarks REALTOR®, REALTORS®, and the REALTOR® logo are controlled by The Canadian Real Estate Association (CREA) and identify real estate professionals who are members of CREA. The trademarks MLS®, Multiple Listing Service® and the associated logos are owned by CREA and identify the quality of services provided by real estate professionals who are members of CREA. Used under license.
          </p>
          <p className="text-[10px] font-light sm:text-xs text-white/50 leading-relaxed text-center mt-3 sm:mt-4">
            ©2025 Summitly. ALL RIGHTS RESERVED
          </p>
        </div>
      </div>
    </footer>
    </>
  )
}

export default Footer
