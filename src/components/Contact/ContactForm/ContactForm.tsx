"use client";

import React from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import Form from "./Form";

const ContactForm = () => {
  return (
    <section className="relative overflow-hidden">
      
      <div className="mx-auto pt-32 pb-40 px-4 sm:px-6 lg:px-8 bg-secondary/20">
        {/* Heading */}
        <header className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Get In Touch
          </h2>
          <p className="mt-4 text-muted-foreground text-base max-w-2xl mx-auto">
            We&apos;ll create high-quality linkable content and build at least 40
            high-authority links to each asset, paving the way for you to grow
            your rankings and improve your brand.
          </p>
        </header>
      </div>
      

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 pb-20">
        

        {/* Two-column card */}
        <div className="rounded-2xl md:rounded-3xl shadow-lg p-4 overflow-hidden bg-card border border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.45fr)_1fr] min-h-[420px]">
            {/* Left panel - Contact Information (your primary color) */}
            <div className="bg-primary text-primary-foreground rounded-2xl p-8 md:p-10 flex flex-col justify-center relative overflow-hidden">
              {/* Decorative circle */}
              <div
                className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full opacity-20"
                style={{ background: "hsl(var(--primary-foreground))" }}
                aria-hidden
              />
              <h3 className="text-xl font-bold mb-2">Contact Information</h3>
              <p className="text-primary-foreground/90 text-sm mb-8">
                We&apos;ll create high-quality linkable content and build at
                least 40 high-authority links to each asset.
              </p>
              <ul className="space-y-6">
                <li className="flex gap-4 items-start">
                  <Phone
                    className="w-5 h-5 shrink-0 mt-0.5"
                    aria-hidden
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">Phone</span>
                    <a
                      href="tel:+13333456868"
                      className="text-primary-foreground/90 hover:text-primary-foreground text-sm"
                    >
                      1-333-345-6868
                    </a>
                    <a
                      href="tel:+18886783638"
                      className="text-primary-foreground/90 hover:text-primary-foreground text-sm"
                    >
                      1-888-678-3638
                    </a>
                  </div>
                </li>
                <li className="flex gap-4 items-start">
                  <Mail
                    className="w-5 h-5 shrink-0 mt-0.5"
                    aria-hidden
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">Email</span>
                    <a
                      href="mailto:support@summitly.com"
                      className="text-primary-foreground/90 hover:text-primary-foreground text-sm break-all"
                    >
                      support@summitly.com
                    </a>
                  </div>
                </li>
                <li className="flex gap-4 items-start">
                  <MapPin
                    className="w-5 h-5 shrink-0 mt-0.5"
                    aria-hidden
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">Location</span>
                    <span className="text-primary-foreground/90 text-sm">
                      101 E 129th St, East Chicago, IN 46312, United States
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Right panel - Form (white) */}
            <div className="p-8 md:p-10 flex flex-col justify-center bg-card">
              <Form />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
