"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { FaUserCircle } from "react-icons/fa";
import { ChevronDown, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import AuthModal from "@/components/Auth/AuthModal";
import { UserProfileDropdown } from "@/components/common/UserProfileDropdown";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const RENTAL_MANAGER_ITEMS = [
  { label: "Price my rental", href: "/manage-rentals/price-my-rental" },
  { label: "Listing", href: "/manage-rentals/listing" },
  { label: "Applications", href: "/manage-rentals/tenant-screening" },
  { label: "Leases", href: "/manage-rentals/leases" },
  { label: "Payment", href: "/manage-rentals/payment" },
] as const;

const APARTMENT_ADVERTISING_ITEMS = [
  { label: "Subscription based ads", href: "/manage-rentals/advertising/subscription" },
  { label: "Pay-per-lease ads", href: "/manage-rentals/advertising/pay-per-lease" },
  { label: "Syndicate listings", href: "/manage-rentals/advertising/syndicate" },
] as const;

function RentalsNavbarDesktop() {
  const pathname = usePathname();
  const [showRentalManager, setShowRentalManager] = useState(false);
  const [showAdvertising, setShowAdvertising] = useState(false);

  const linkClass = (href: string) =>
    cn(
      "block px-3 py-2 text-sm font-medium rounded-lg transition-colors",
      pathname === href
        ? "bg-primary/10 text-primary"
        : "text-foreground hover:bg-brand-tide hover:text-primary"
    );

  return (
    <>
      <nav className="hidden lg:flex items-center gap-1">
        {/* Rental manager dropdown */}
        <div
          className="relative"
          onMouseEnter={() => setShowRentalManager(true)}
          onMouseLeave={() => setShowRentalManager(false)}
        >
          <button
            type="button"
            className={cn(
              "px-4 py-2 text-base font-medium rounded-lg flex items-center gap-1 transition-colors",
              "text-foreground hover:text-primary hover:bg-brand-tide"
            )}
            aria-expanded={showRentalManager}
            aria-haspopup="true"
          >
            Rental manager
            <ChevronDown
              className={cn("w-4 h-4 transition-transform", showRentalManager && "rotate-180")}
              aria-hidden
            />
          </button>
          {typeof window !== "undefined" &&
            createPortal(
              <AnimatePresence>
                {showRentalManager && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="fixed left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border shadow-lg z-[98]"
                    style={{ top: "6.5rem" }}
                    onMouseEnter={() => setShowRentalManager(true)}
                    onMouseLeave={() => setShowRentalManager(false)}
                  >
                    <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 py-4">
                      <div className="flex flex-wrap gap-x-8 gap-y-2">
                        {RENTAL_MANAGER_ITEMS.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={linkClass(item.href)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>,
              document.body
            )}
        </div>

        {/* Apartment advertising dropdown */}
        <div
          className="relative"
          onMouseEnter={() => setShowAdvertising(true)}
          onMouseLeave={() => setShowAdvertising(false)}
        >
          <button
            type="button"
            className={cn(
              "px-4 py-2 text-base font-medium rounded-lg flex items-center gap-1 transition-colors",
              "text-foreground hover:text-primary hover:bg-brand-tide"
            )}
            aria-expanded={showAdvertising}
            aria-haspopup="true"
          >
            Apartment advertising
            <ChevronDown
              className={cn("w-4 h-4 transition-transform", showAdvertising && "rotate-180")}
              aria-hidden
            />
          </button>
          {typeof window !== "undefined" &&
            createPortal(
              <AnimatePresence>
                {showAdvertising && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="fixed left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border shadow-lg z-[98]"
                    style={{ top: "6.5rem" }}
                    onMouseEnter={() => setShowAdvertising(true)}
                    onMouseLeave={() => setShowAdvertising(false)}
                  >
                    <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 py-4">
                      <div className="flex flex-wrap gap-x-8 gap-y-2">
                        {APARTMENT_ADVERTISING_ITEMS.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={linkClass(item.href)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>,
              document.body
            )}
        </div>

        <Link href="/manage-rentals/resources" className={linkClass("/manage-rentals/resources")}>
          Resources
        </Link>
        <Link href="/contact" className={linkClass("/contact")}>
          Contact sales
        </Link>
      </nav>
    </>
  );
}

function RentalsNavbarMobile() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const linkClass = (href: string) =>
    cn(
      "block py-3 px-4 text-base font-medium rounded-lg transition-colors border-b border-border/40 last:border-0",
      pathname === href
        ? "bg-primary/10 text-primary"
        : "text-foreground hover:bg-muted/50"
    );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="lg:hidden p-2 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent/50"
          aria-label="Open rentals menu"
        >
          <Menu className="w-6 h-6" aria-hidden />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85%] sm:max-w-sm z-[101]">
        <SheetHeader className="sr-only">
          <SheetTitle>Rentals menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col pt-6">
          <div className="mb-2">
            <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Rental manager
            </p>
            {RENTAL_MANAGER_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClass(item.href)}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mb-2">
            <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Apartment advertising
            </p>
            {APARTMENT_ADVERTISING_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClass(item.href)}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Link
            href="/manage-rentals/resources"
            className={linkClass("/manage-rentals/resources")}
            onClick={() => setOpen(false)}
          >
            Resources
          </Link>
          <Link href="/contact" className={linkClass("/contact")} onClick={() => setOpen(false)}>
            Contact sales
          </Link>
          <div className="mt-4 px-4">
            <Link href="/manage-rentals/dashboard/properties/new" onClick={() => setOpen(false)}>
              <Button className="w-full" size="lg">
                Post your listing
              </Button>
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function RentalsNavbar() {
  const { data: session } = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <header
        className="fixed top-10 left-0 right-0 z-[99] bg-white/85 backdrop-blur-md shadow-sm navbar-smooth"
        style={{ minHeight: "4rem", height: "4rem" }}
      >
        <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-4 lg:gap-6">
              <Link href="/manage-rentals" className="flex items-center flex-shrink-0" aria-label="Summitly Rentals home">
                <Image
                  src="/images/logo/summitly-logo.png"
                  alt="Summitly Logo"
                  width={200}
                  height={60}
                  className="h-8 w-auto transition-all duration-300"
                  priority
                  quality={75}
                />
              </Link>
              <RentalsNavbarDesktop />
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              {session ? (
                <UserProfileDropdown variant="rentals" />
              ) : (
                <Button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center space-x-2 rounded-full"
                  variant="default"
                >
                  <FaUserCircle className="w-4 h-4" aria-hidden />
                  <span className="hidden sm:inline">Login / Signup</span>
                  <span className="sm:hidden">Login</span>
                </Button>
              )}
              <RentalsNavbarMobile />
              <Link href="/manage-rentals/dashboard/properties/new" className="hidden lg:inline-flex">
                <Button size="default">Post your listing</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      <AuthModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}
