"use client";

import React, { useState } from "react";
import { ArrowRight, Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AssignmentContactSection: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isRealtor, setIsRealtor] = useState<"no" | "yes" | "">("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifySubmitted, setNotifySubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to contact/lead API
  };

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail) return;
    setNotifySubmitting(true);
    // TODO: wire to notify API
    await new Promise((r) => setTimeout(r, 500));
    setNotifySubmitting(false);
    setNotifySubmitted(true);
    setNotifyEmail("");
  };

  return (
    <section
      className="bg-slate-100/80 py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8"
      aria-labelledby="assignment-contact-heading"
    >
      <div className="container-1400 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left: Need help with Assignment Sale - Contact form */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/80 p-6 sm:p-8">
            <h2
              id="assignment-contact-heading"
              className="text-xl sm:text-2xl md:text-3xl font-bold text-zinc-900 mb-1"
            >
              Need help with Assignment Sale?
            </h2>
            <p className="text-zinc-500 text-sm sm:text-base mb-6">
              Don&apos;t know where to start? Contact us today!
            </p>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                  aria-label="First name"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                  aria-label="Last name"
                />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                aria-label="Email address"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                aria-label="Phone number"
              />
              <div>
                <p className="text-sm font-medium text-zinc-700 mb-2">
                  Are you a realtor or working with one?
                </p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isRealtor"
                      checked={isRealtor === "no"}
                      onChange={() => setIsRealtor("no")}
                      className="w-4 h-4 text-secondary border-slate-300 focus:ring-secondary"
                    />
                    <span className="text-sm text-zinc-700">No</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isRealtor"
                      checked={isRealtor === "yes"}
                      onChange={() => setIsRealtor("yes")}
                      className="w-4 h-4 text-secondary border-slate-300 focus:ring-secondary"
                    />
                    <span className="text-sm text-zinc-700">Yes</span>
                  </label>
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                By submitting this form, you give express written consent to
                Summitly and its authorized representatives to contact you via
                email, telephone, text message, and other forms of electronic
                communication.
              </p>
              <Button
                type="submit"
                className="w-full rounded-xl "
              >
                Contact Now
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Button>
            </form>
          </div>

          {/* Right: Notify Me of New Projects */}
          <div
            className={cn(
              "rounded-2xl sm:rounded-3xl overflow-hidden",
              "bg-gradient-to-br from-[#06262F] via-[#06262F]/80 to-[#06262F]",
              "p-6 sm:p-8 flex flex-col"
            )}
          >
            <span
              className="inline-flex items-center gap-2 rounded-lg bg-teal-500/30 text-white px-3 py-1.5 text-xs font-medium w-fit mb-4"
              aria-hidden
            >
              <Bell className="h-4 w-4" />
              Get Notified
            </span>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
              Notify Me of New Projects
            </h3>
            <p className="text-white/90 text-sm sm:text-base mb-4">
              Send me information about new projects that are launching or
              selling.
            </p>
            <div className="flex items-center gap-2 mb-6">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-slate-600 border-2 border-teal-800"
                    aria-hidden
                  />
                ))}
              </div>
              <p className="text-white text-sm">
                Join <span className="font-bold">500,000+</span> Buyers &
                Investors
              </p>
            </div>
            <form onSubmit={handleNotifySubmit} className="space-y-3 mt-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40"
                aria-label="Email address"
                required
              />
              <Button
                type="submit"
                disabled={notifySubmitting || notifySubmitted}
                className="w-full rounded-xl bg-white text-teal-800 hover:bg-white/90 font-medium py-3"
              >
                {notifySubmitting
                  ? "Submitting..."
                  : notifySubmitted
                    ? "Subscribed!"
                    : "Notify Me"}
              </Button>
              <p className="flex items-center gap-2 text-white/70 text-xs">
                <Check className="h-4 w-4 shrink-0" aria-hidden />
                No spam, ever • Unsubscribe anytime
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AssignmentContactSection;
