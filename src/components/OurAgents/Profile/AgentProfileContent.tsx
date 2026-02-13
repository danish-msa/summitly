"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, Award, ArrowRight } from "lucide-react";
import { PropertyTypeDistributionChart } from "./PropertyTypeDistributionChart";
import { AgentRatingReviews } from "./AgentRatingReviews";
import { AgentServiceAreasMap } from "./AgentServiceAreasMap";
import { TestimonialCard } from "@/components/ui/testimonial-card";
import type { Agent } from "@prisma/client";
import type {
  AgentServiceArea,
  AgentFeaturedListing,
  AgentReview,
} from "@prisma/client";
import { getBlogPosts } from "@/data/data";
import BlogCard from "@/components/Home/Blogs/BlogCard";
import FAQ, { type FaqItem } from "@/components/common/FAQ/FAQ";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectWithLabel,
} from "@/components/ui/select";

type AgentWithContent = Agent & {
  service_areas: AgentServiceArea[];
  featured_listings: AgentFeaturedListing[];
  reviews?: AgentReview[] | null;
  /** Awards and recognitions (optional; add to schema/API when ready) */
  awards_recognitions?: string[] | null;
};

interface AgentProfileContentProps {
  agent: AgentWithContent;
}

const AREAS_DISPLAY_LIMIT = 12;

// Mock reviews when agent has no reviews yet (for demo)
const MOCK_AGENT_REVIEWS = [
  {
    id: "mock-1",
    name: "Sarah Mitchell",
    role: "First-time Homebuyer",
    rating: 5,
    content:
      "Incredibly professional and made the entire process stress-free. Would definitely recommend to anyone looking to buy or sell.",
  },
  {
    id: "mock-2",
    name: "David Chen",
    role: "Real Estate Investor",
    rating: 5,
    content:
      "Great communication and deep market knowledge. Helped us secure a fantastic property. Very pleased with the experience.",
  },
  {
    id: "mock-3",
    name: "Emily Rodriguez",
    role: "Young Professional",
    rating: 5,
    content:
      "From start to finish, everything was handled with care. Responsive, knowledgeable, and a pleasure to work with.",
  },
];

// Mock data for Recent Experience section
const MOCK_TOP_CITIES = [
  { city: "Toronto", percentage: 15 },
  { city: "North York", percentage: 9 },
  { city: "Pickering", percentage: 9 },
  { city: "Oakville", percentage: 9 },
  { city: "Mississauga", percentage: 8 },
  { city: "Brampton", percentage: 7 },
];

// Mock data for Awards and Recognitions (when agent has none from backend)
const MOCK_AWARDS_RECOGNITIONS = [
  "Top 1% Producer – Regional Sales Award",
  "RE/MAX Platinum Club – 5+ Years",
  "CREA Certified Professional (CP)",
  "Best in Client Satisfaction – Toronto Board",
  "Million Dollar Club – 2022 & 2023",
];

export function AgentProfileContent({ agent }: AgentProfileContentProps) {
  const router = useRouter();
  const [showAllAreas, setShowAllAreas] = useState(false);
  const [contactHighlight, setContactHighlight] = useState(false);
  const contactSectionRef = useRef<HTMLDivElement>(null);
  const areas = agent.service_areas ?? [];

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const checkHash = () => {
      if (typeof window === "undefined" || window.location.hash !== "#contact") return;
      contactSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setContactHighlight(true);
      timeoutId = setTimeout(() => setContactHighlight(false), 2500);
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => {
      window.removeEventListener("hashchange", checkHash);
      clearTimeout(timeoutId);
    };
  }, []);
  const displayedAreas = showAllAreas
    ? areas
    : areas.slice(0, AREAS_DISPLAY_LIMIT);
  const hasMoreAreas = areas.length > AREAS_DISPLAY_LIMIT;
  const featuredListings = (agent.featured_listings ?? []).sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return (
    <section className="bg-background py-10 sm:py-14">
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-8 lg:gap-12">
          {/* Left column */}
          <div className="space-y-10">
            {/* About */}
            {(agent.about_agent || agent.tagline) && (
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  About {agent.first_name}
                </h2>
                {agent.tagline && (
                  <p className="text-muted-foreground mb-2 font-medium">
                    {agent.tagline}
                  </p>
                )}
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {agent.about_agent ?? ""}
                </p>
              </div>
            )}


            {/* Featured Listings */}
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                Featured Listings
              </h2>
              {featuredListings.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No featured listings at the moment.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {featuredListings.map((fl) => (
                    <FeaturedListingCard
                      key={fl.id}
                      mlsNumber={fl.mlsNumber}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Awards and Recognitions */}
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                Awards and Recognitions
              </h2>
              {(() => {
                const items = (agent.awards_recognitions?.length ?? 0) > 0
                  ? agent.awards_recognitions!
                  : MOCK_AWARDS_RECOGNITIONS;
                return (
                  <ul className="space-y-4" aria-label="Awards and recognitions">
                    {items.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 rounded-lg shadow-sm bg-muted/30 px-4 py-3 text-sm text-foreground"
                      >
                        <Award className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>

            
          </div>

          {/* Right column: Contact form + Badge */}
          <div
            id="contact"
            ref={contactSectionRef}
            className={`scroll-mt-24 transition-shadow duration-500 rounded-2xl ${contactHighlight ? "ring-2 ring-primary ring-offset-4 shadow-lg shadow-primary/20" : ""}`}
          >
            <div className="space-y-6">
              {agent.allow_contact_form && (
                <ContactForm agentName={agent.full_name} agentId={agent.id} />
              )}
            {/* {agent.verified_agent && (
              <div className="rounded-2xl price-card-gradient p-6 text-white shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <Award className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Top 1% Producer
                    </h3>
                    <p className="mt-1 text-sm text-white/90">
                      Recognized as one of the top performing agents in the
                      region for three consecutive years.
                    </p>
                  </div>
                </div>
              </div>
            )} */}

            {/* How much is your home worth? CTA */}
            <div className="rounded-2xl price-card-gradient border border-border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-white">
                How much is your home worth?
              </h3>
              <p className="mt-2 text-sm text-white">
                Get a free, no-obligation estimate of your home&apos;s value. See what similar properties are selling for and plan your next move with confidence.
              </p>
              <Button
                asChild
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Link href="/homeowner">Get your home value</Link>
              </Button>
            </div>
            </div>
          </div>
        </div>

        {/* Recent Experience - hidden for now */}
        {false && <RecentExperienceSection />}

        {/* Service areas map - boundaries + properties */}
        {(agent.service_areas?.length ?? 0) > 0 && (
          <AgentServiceAreasMap
            serviceAreas={agent.service_areas}
            className="mt-14 pt-10 border-t border-border"
          />
        )}

        {/* Rating and Reviews */}
        <div className="mt-14 pt-10 border-t border-border">
          <AgentRatingReviews
            overallRating={agent.overall_rating}
            totalReviewsCount={agent.total_reviews_count}
          />
          {/* Testimonials from reviews (real or 3 mocks when none) */}
          {(agent.reviews?.length ?? 0) > 0 ? (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...(agent.reviews ?? [])]
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .map((review) => (
                  <TestimonialCard
                    key={review.id}
                    name={review.reviewer_name}
                    rating={review.rating}
                    content={review.review_text}
                    showQuoteIcon
                  />
                ))}
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_AGENT_REVIEWS.map((review) => (
                <TestimonialCard
                  key={review.id}
                  name={review.name}
                  role={review.role}
                  rating={review.rating}
                  content={review.content}
                  showQuoteIcon
                />
              ))}
            </div>
          )}
        </div>

        {/* Blog section */}
        {(() => {
          const bySearch = getBlogPosts({ search: "real estate" }).slice(0, 3);
          const blogPosts =
            bySearch.length > 0 ? bySearch : getBlogPosts().slice(0, 3);
          if (blogPosts.length === 0) {
            return null;
          }
          return (
            <div className="mt-14 pt-10 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Latest News & Insights
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Stay informed with the latest real estate news and expert advice.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogPosts.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>
              <div className="mt-6">
                <Link
                  href="/blogs"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  View all articles
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          );
        })()}

        {/* FAQ section */}
        <div className="mt-14 pt-10 border-t border-border">
          <FAQ
            initialFaqs={AGENT_FAQ_ITEMS}
            heading="Frequently asked questions"
            subheading="FAQ"
            description="Common questions about working with your agent and the buying or selling process."
            showLoadMore={false}
            className="!py-0 !px-0 max-w-none"
          />
        </div>
      </div>
    </section>
  );
}

const AGENT_FAQ_ITEMS: FaqItem[] = [
  {
    id: "agent-1",
    question: "How do I contact this agent?",
    answer:
      "Use the contact form on this page to send a message directly to the agent. You can also call or email using the details shown in their profile. They typically respond within 24–48 hours.",
  },
  {
    id: "agent-2",
    question: "Is there a fee to work with this agent?",
    answer:
      "Buyer representation is typically free for buyers—the agent’s commission is usually paid by the seller. For sellers, commission is agreed in the listing agreement. Ask the agent for details specific to your situation.",
  },
  {
    id: "agent-3",
    question: "What areas does this agent cover?",
    answer:
      "Service areas are listed on this profile. You can also view the map to see where this agent is active. They can often assist with nearby areas—reach out to confirm availability for your location.",
  },
  {
    id: "agent-4",
    question: "How do I schedule a property viewing?",
    answer:
      "Submit an inquiry through the contact form or call/email the agent. Mention the listing address or type of property you’re interested in, and they will arrange a viewing at a time that works for you.",
  },
  {
    id: "agent-5",
    question: "Can this agent help me both buy and sell?",
    answer:
      "Yes. Most agents assist with both buying and selling. Indicate your purpose (buy, sell, or both) in the contact form so they can tailor their response and next steps.",
  },
  {
    id: "agent-6",
    question: "What should I prepare before contacting an agent?",
    answer:
      "It helps to have an idea of your budget, preferred areas, and must-haves (e.g. bedrooms, type of property). For sellers, rough details about your current home and timeline are useful. The agent can guide you from there.",
  },
];

function RecentExperienceSection() {
  const [showAllCities, setShowAllCities] = useState(false);
  const citiesToShow = showAllCities ? MOCK_TOP_CITIES : MOCK_TOP_CITIES.slice(0, 4);
  const hasMoreCities = MOCK_TOP_CITIES.length > 4;
  const citiesTotal = citiesToShow.reduce((sum, c) => sum + c.percentage, 0);

  return (
    <div className="mt-14 pt-10 border-t border-border">
      <h2 className="text-2xl font-semibold text-foreground mb-6">
        Recent Experience
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
        <div>
          <span className="inline-block rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground">
            Top cities (by transactions)
          </span>
          <ul className="mt-10 space-y-4" aria-label="Top cities by transactions">
            {citiesToShow.map(({ city, percentage }) => {
              const barWidth =
                citiesTotal > 0 ? (percentage / citiesTotal) * 100 : 0;
              return (
                <li key={city} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-sm text-foreground">
                    {city}
                  </span>
                  <div className="min-w-0 flex-1 rounded-full bg-muted/80 h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#38bdf8] transition-[width] duration-300"
                      style={{ width: `${barWidth}%` }}
                      role="presentation"
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-sm font-medium text-foreground tabular-nums">
                    {percentage}%
                  </span>
                </li>
              );
            })}
          </ul>
          {hasMoreCities && !showAllCities && (
            <button
              type="button"
              onClick={() => setShowAllCities(true)}
              className="mt-4 w-full rounded-lg border border-[#38bdf8] bg-white py-2.5 text-sm font-medium text-[#0ea5e9] hover:bg-sky-50 transition-colors"
            >
              Show more
            </button>
          )}
        </div>
        <div>
          <span className="inline-block rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground">
            Property type distribution
          </span>
          <div className="mt-10 w-full">
            <PropertyTypeDistributionChart />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturedListingCard({ mlsNumber }: { mlsNumber: string }) {
  const searchUrl = `/buy?mls=${encodeURIComponent(mlsNumber)}`;
  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <div className="relative aspect-[4/3] bg-muted">
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
          MLS: {mlsNumber}
        </div>
      </div>
      <div className="p-4">
        <Link
          href={searchUrl}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Get Property Report
        </Link>
      </div>
    </div>
  );
}

function ContactForm({
  agentName,
  agentId,
}: {
  agentName: string;
  agentId: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [iAmA, setIAmA] = useState("");
  const [planningTimeline, setPlanningTimeline] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!iAmA.trim() || !planningTimeline.trim()) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const firstName = (fd.get("firstName") as string)?.trim() ?? "";
    const lastName = (fd.get("lastName") as string)?.trim() ?? "";
    try {
      const res = await fetch("/api/contact-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`.trim(),
          email: fd.get("email"),
          phone: fd.get("phone"),
          iAmA: iAmA.trim(),
          planningTimeline: planningTimeline.trim(),
          message: fd.get("message"),
        }),
      });
      if (res.ok) {
        setStatus("sent");
        form.reset();
        setIAmA("");
        setPlanningTimeline("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-2xl bg-card p-8 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">
        Contact {agentName}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Interested in working together? Send me a message.
      </p>
      {status === "sent" ? (
        <p className="mt-4 text-sm text-green-600 font-medium">
          Message sent. We&apos;ll get back to you soon.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              id="contact-first-name"
              name="firstName"
              type="text"
              required
              label="First Name"
            />
            <Input
              id="contact-last-name"
              name="lastName"
              type="text"
              required
              label="Last Name"
            />
          </div>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            label="Email"
          />
          <Input
            id="contact-phone"
            name="phone"
            type="tel"
            label="Phone (optional)"
          />
          <SelectWithLabel
            label="I am a"
            value={iAmA}
            onValueChange={setIAmA}
            required
          >
            <SelectTrigger id="contact-i-am-a">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Buyer">Buyer</SelectItem>
              <SelectItem value="Seller">Seller</SelectItem>
              <SelectItem value="Buyer & Seller">Buyer & Seller</SelectItem>
              <SelectItem value="Tenant">Tenant</SelectItem>
              <SelectItem value="Landlord">Landlord</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </SelectWithLabel>
          <SelectWithLabel
            label="When are you planning to Buy or Sell?"
            value={planningTimeline}
            onValueChange={setPlanningTimeline}
            required
          >
            <SelectTrigger id="contact-planning-timeline">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ASAP">ASAP</SelectItem>
              <SelectItem value="Within 1 month">Within 1 month</SelectItem>
              <SelectItem value="1-3 months">1-3 months</SelectItem>
              <SelectItem value="3-6 months">3-6 months</SelectItem>
              <SelectItem value="6+ months">6+ months</SelectItem>
              <SelectItem value="Just exploring">Just exploring</SelectItem>
            </SelectContent>
          </SelectWithLabel>
          <Textarea
            id="contact-message"
            name="message"
            rows={4}
            required
            label="Message"
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            By submitting this form, you agree to be contacted by this agent or their team regarding your inquiry. Your information will not be shared with third parties for marketing purposes.
          </p>
          {status === "error" && (
            <p className="text-sm text-destructive">
              Something went wrong. Please try again.
            </p>
          )}
          <Button
            type="submit"
            disabled={status === "sending"}
            size="lg"
            className="w-full sm:w-auto"
          >
            <Send className="h-4 w-4" aria-hidden />
            {status === "sending" ? "Sending…" : "Send Message"}
          </Button>
        </form>
      )}
    </div>
  );
}
