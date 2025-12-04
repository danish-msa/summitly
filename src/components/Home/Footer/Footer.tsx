import React from 'react'
import { BiEnvelope, BiPhoneCall } from 'react-icons/bi'
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube, FaLinkedin } from 'react-icons/fa'
import { 
  Home, 
  Building2, 
  Calculator, 
  BookOpen, 
  Users,
  TrendingUp,
  Shield,
  HelpCircle,
  Info
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ContactMethods } from '../ContactMethods/ContactMethods'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <>
      <ContactMethods />

      {/* CTA Section */}
      <div className='w-full py-8 sm:py-10 bg-gradient-to-r from-primary to-primary/90'>
        <div className='container-1400 mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-4 sm:gap-6 justify-between items-center'>
          <div className='w-full md:w-[60%] text-white text-center md:text-left'>
            <h2 className='text-lg sm:text-xl md:text-2xl font-bold mb-2'>Want to Become a Real Estate Agent?</h2>
            <p className='text-sm sm:text-base text-white/90'>Join Summitly and grow your real estate career with our comprehensive platform and tools.</p>
          </div>
          <Link 
            href="/agents" 
            className='btn bg-white border-4 border-blue-300 px-6 sm:px-8 md:px-10 py-2 sm:py-3 text-primary hover:text-white hover:bg-primary rounded-full text-sm sm:text-base font-medium whitespace-nowrap transition-all duration-300'
          >
            Sign Up Today
          </Link>
        </div>
      </div>

      {/* Main Footer */}
      <footer className='pt-12 sm:pt-16 md:pt-20 pb-8 sm:pb-12 bg-muted'>
        <div className='container-1400 mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Top Section - Logo and Social */}
          <div className='flex flex-col sm:flex-row space-y-6 sm:space-y-0 sm:space-x-8 justify-between items-center sm:items-start pb-8 sm:pb-10 mb-8 sm:mb-10 border-b border-border'>
            {/* Logo and Description */}
            <div className='flex flex-col items-center sm:items-start space-y-4 max-w-md'>
              <Link href="/" className="flex items-center">
                <Image 
                  src="/images/logo/summitly_logo.png" 
                  alt="Summitly Logo" 
                  width={200} 
                  height={60}
                  className="w-auto h-8 md:h-12"
                  priority
                />
              </Link>
              <p className='text-sm text-muted-foreground text-center sm:text-left leading-relaxed'>
                Your trusted partner in real estate. We help you find your perfect home, make informed decisions, and connect with expert real estate professionals across Canada.
              </p>
              {/* Contact Info */}
              <div className='flex flex-col space-y-2 w-full'>
                <a href="mailto:info@summitly.com" className='flex items-center space-x-2 text-sm text-foreground hover:text-primary transition-colors'>
                  <BiEnvelope className='w-4 h-4 text-primary'/>
                  <span>info@summitly.com</span>
                </a>
                <a href="tel:+15551234567" className='flex items-center space-x-2 text-sm text-foreground hover:text-primary transition-colors'>
                  <BiPhoneCall className='w-4 h-4 text-primary'/>
                  <span>+1 (555) 123-4567</span>
                </a>
              </div>
            </div>
            
            {/* Social Links */}
            <div className='flex flex-col items-center sm:items-start space-y-4'>
              <h3 className='text-sm font-semibold text-foreground'>Follow Us</h3>
              <div className='flex items-center space-x-4'>
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className='text-muted-foreground hover:text-primary transition-colors'
                  aria-label="Facebook"
                >
                  <FaFacebookF className='w-5 h-5 hover:scale-110 transition-transform'/>
                </a>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className='text-muted-foreground hover:text-primary transition-colors'
                  aria-label="Twitter"
                >
                  <FaTwitter className='w-5 h-5 hover:scale-110 transition-transform'/>
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className='text-muted-foreground hover:text-primary transition-colors'
                  aria-label="Instagram"
                >
                  <FaInstagram className='w-5 h-5 hover:scale-110 transition-transform'/>
                </a>
                <a 
                  href="https://youtube.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className='text-muted-foreground hover:text-primary transition-colors'
                  aria-label="YouTube"
                >
                  <FaYoutube className='w-5 h-5 hover:scale-110 transition-transform'/>
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className='text-muted-foreground hover:text-primary transition-colors'
                  aria-label="LinkedIn"
                >
                  <FaLinkedin className='w-5 h-5 hover:scale-110 transition-transform'/>
                </a>
              </div>
            </div>
          </div>

          {/* Links Grid */}
          <div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 pb-8 sm:pb-10 mb-8 sm:mb-10 border-b border-border'>
            {/* Buy & Sell */}
            <div className='flex flex-col space-y-4'>
              <h3 className='text-base font-bold text-foreground flex items-center gap-2'>
                <Home className='w-4 h-4 text-primary'/>
                Buy & Sell
              </h3>
              <div className='flex flex-col space-y-2.5'>
                <Link href="/buy" className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                  Buy a Home
                </Link>
                <Link href="/sell" className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                  Sell Your Home
                </Link>
                <Link href="/home-estimation" className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                  Home Evaluation
                </Link>
                <Link href="/new-homes" className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                  New Homes
                </Link>
                <Link href="/listings" className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                  Browse Listings
                </Link>
              </div>
            </div>

            {/* Rent */}
            <div className='flex flex-col space-y-4'>
              <h3 className='text-base font-bold text-foreground flex items-center gap-2'>
                <Building2 className='w-4 h-4 text-primary'/>
                Rent
              </h3>
              <div className='flex flex-col space-y-2.5'>
                <Link href="/rent" className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                  Find Rentals
                </Link>
                <Link href="/rent?type=apartments" className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                  Apartments
                </Link>
                <Link href="/rent?type=houses" className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                  Houses
                </Link>
                <Link href="/rent?type=condos" className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                  Condos
                </Link>
                <Link href="/renting-guide" className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                  Renting Guide
                </Link>
              </div>
            </div>

            {/* Pre-Construction */}
            <div className='flex flex-col space-y-4'>
              <h3 className='text-base font-bold text-foreground flex items-center gap-2'>
                <TrendingUp className='w-4 h-4 text-primary'/>
                Pre-Construction
              </h3>
              <div className='flex flex-col space-y-2.5'>
                <Link href="/pre-construction" className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                  Pre-Con Projects
                </Link>
                <Link href="/pre-construction/condos" className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                  Condos
                </Link>
                <Link href="/pre-construction/houses" className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                  Houses
                </Link>
                <Link href="/pre-construction/now-selling" className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                  Now Selling
                </Link>
                <Link href="/pre-construction/coming-soon" className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                  Coming Soon
                </Link>
              </div>
            </div>

            {/* Tools & Resources */}
            <div className='flex flex-col space-y-4'>
              <h3 className='text-base font-bold text-foreground flex items-center gap-2'>
                <Calculator className='w-4 h-4 text-primary'/>
                Tools & Resources
              </h3>
              <div className='flex flex-col space-y-2.5'>
                <Link href="/calculators" className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                  Calculators
                </Link>
                <Link href="/calculators/affordability" className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                  Affordability Calculator
                </Link>
                <Link href="/calculators/rent" className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                  Rent Calculator
                </Link>
                <Link href="/map-search" className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                  Map Search
                </Link>
                <Link href="/buying-guide" className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                  Buying Guide
                </Link>
              </div>
            </div>
          </div>

          {/* Additional Links Row */}
          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 pb-8 sm:pb-10 mb-8 sm:mb-10 border-b border-border'>
            {/* Find a Realtor */}
            <div className='flex flex-col space-y-3'>
              <h3 className='text-sm font-semibold text-foreground flex items-center gap-2'>
                <Users className='w-4 h-4 text-primary'/>
                Agents
              </h3>
              <div className='flex flex-col space-y-2'>
                <Link href="/agents" className='text-xs text-muted-foreground hover:text-primary transition-colors'>
                  Find a Realtor
                </Link>
                <Link href="/agents" className='text-xs text-muted-foreground hover:text-primary transition-colors'>
                  Join as Agent
                </Link>
              </div>
            </div>

            {/* Learn */}
            <div className='flex flex-col space-y-3'>
              <h3 className='text-sm font-semibold text-foreground flex items-center gap-2'>
                <BookOpen className='w-4 h-4 text-primary'/>
                Learn
              </h3>
              <div className='flex flex-col space-y-2'>
                <Link href="/blogs" className='text-xs text-muted-foreground hover:text-primary transition-colors'>
                  Blog
                </Link>
                <Link href="/articles?category=home-buying" className='text-xs text-muted-foreground hover:text-primary transition-colors'>
                  Buying Articles
                </Link>
                <Link href="/articles?category=renting" className='text-xs text-muted-foreground hover:text-primary transition-colors'>
                  Renting Articles
                </Link>
              </div>
            </div>

            {/* Company */}
            <div className='flex flex-col space-y-3'>
              <h3 className='text-sm font-semibold text-foreground flex items-center gap-2'>
                <Info className='w-4 h-4 text-primary'/>
                Company
              </h3>
              <div className='flex flex-col space-y-2'>
                <Link href="/about" className='text-xs text-muted-foreground hover:text-primary transition-colors'>
                  About Us
                </Link>
                <Link href="/contact" className='text-xs text-muted-foreground hover:text-primary transition-colors'>
                  Contact Us
                </Link>
                <Link href="/faqs" className='text-xs text-muted-foreground hover:text-primary transition-colors'>
                  FAQs
                </Link>
              </div>
            </div>

            {/* Legal */}
            <div className='flex flex-col space-y-3'>
              <h3 className='text-sm font-semibold text-foreground flex items-center gap-2'>
                <Shield className='w-4 h-4 text-primary'/>
                Legal
              </h3>
              <div className='flex flex-col space-y-2'>
                <Link href="/privacy-policy" className='text-xs text-muted-foreground hover:text-primary transition-colors'>
                  Privacy Policy
                </Link>
                <Link href="/terms-of-service" className='text-xs text-muted-foreground hover:text-primary transition-colors'>
                  Terms of Service
                </Link>
                <Link href="/cookie-policy" className='text-xs text-muted-foreground hover:text-primary transition-colors'>
                  Cookie Policy
                </Link>
              </div>
            </div>

            {/* Help */}
            <div className='flex flex-col space-y-3'>
              <h3 className='text-sm font-semibold text-foreground flex items-center gap-2'>
                <HelpCircle className='w-4 h-4 text-primary'/>
                Help
              </h3>
              <div className='flex flex-col space-y-2'>
                <Link href="/faqs" className='text-xs text-muted-foreground hover:text-primary transition-colors'>
                  Help Center
                </Link>
                <Link href="/contact" className='text-xs text-muted-foreground hover:text-primary transition-colors'>
                  Support
                </Link>
                <a 
                  href="https://mortgagesquad.ca" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className='text-xs text-muted-foreground hover:text-primary transition-colors'
                >
                  Mortgage Services
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className='space-y-4'>
            {/* CREA Disclaimer */}
            <div className='mb-6'>
              <p className='text-xs text-muted-foreground text-center leading-relaxed max-w-4xl mx-auto'>
                For listings in Canada, the trademarks REALTOR®, REALTORS®, and the REALTOR® logo are controlled by The Canadian Real Estate Association (CREA) and identify real estate professionals who are members of CREA. The trademarks MLS®, Multiple Listing Service® and the associated logos are owned by CREA and identify the quality of services provided by real estate professionals who are members of CREA. Used under license.
              </p>
            </div>

            {/* Copyright */}
            <div className='flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 pt-4 border-t border-border'>
              <p className='text-xs text-muted-foreground text-center sm:text-left'>
                © {currentYear} Summitly. All Rights Reserved.
              </p>
              <div className='flex items-center space-x-4'>
                <Link href="/privacy-policy" className='text-xs text-muted-foreground hover:text-primary transition-colors'>
                  Privacy
                </Link>
                <span className='text-muted-foreground'>•</span>
                <Link href="/terms-of-service" className='text-xs text-muted-foreground hover:text-primary transition-colors'>
                  Terms
                </Link>
                <span className='text-muted-foreground'>•</span>
                <Link href="/sitemap" className='text-xs text-muted-foreground hover:text-primary transition-colors'>
                  Sitemap
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Footer
