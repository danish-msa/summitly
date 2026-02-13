"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronLeft, Loader2, X, Star, Trash2 } from "lucide-react";
import { isAdmin } from "@/lib/roles";
import { DEFAULT_ABOUT_AGENT } from "@/lib/constants/agents";

function isImageUrl(text: string): boolean {
  const t = text.trim();
  return (
    t.startsWith("http://") ||
    t.startsWith("https://") ||
    t.startsWith("data:")
  );
}

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    || "";
}

const SPECIALIZATION_OPTIONS = ["Residential", "Commercial", "Pre-Construction"] as const;

const SECTIONS = [
  { id: "basic", label: "Basic Info" },
  { id: "social", label: "Social Links" },
  { id: "reviews", label: "Testimonials" },
];

type PendingReview = { reviewer_name: string; rating: number; review_text: string };

export default function NewAgentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<string[]>(["basic", "social", "reviews"]);
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [newReview, setNewReview] = useState<PendingReview>({
    reviewer_name: "",
    rating: 5,
    review_text: "",
  });

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    full_name: "",
    job_title: "Real Estate Agent",
    agent_type: "RESIDENTIAL" as "COMMERCIAL" | "RESIDENTIAL" | "BOTH",
    slug: "",
    email: "",
    phone: "",
    website_url: "",
    profile_image: "",
    cover_image: "",
    about_agent: DEFAULT_ABOUT_AGENT,
    tagline: "",
    primary_focus: "",
    industry_role: "",
    property_specialties: [] as string[],
    languages_spoken: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    linkedin: "",
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
  });

  useEffect(() => {
    const updateSidebarWidth = () => {
      const sidebar = document.querySelector('[data-sidebar], .sidebar, [class*="sidebar"]') as HTMLElement;
      if (sidebar) setSidebarWidth(sidebar.offsetWidth);
      else {
        const mainContainer = document.querySelector("main")?.parentElement;
        if (mainContainer) {
          const sidebarElement = mainContainer.querySelector("[class*=\"w-\"]") as HTMLElement;
          if (sidebarElement && sidebarElement !== mainContainer.querySelector("main")?.parentElement) {
            setSidebarWidth(sidebarElement.offsetWidth);
          }
        }
      }
    };
    updateSidebarWidth();
    window.addEventListener("resize", updateSidebarWidth);
    const interval = setInterval(updateSidebarWidth, 200);
    return () => {
      window.removeEventListener("resize", updateSidebarWidth);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated" && session?.user) {
      if (!isAdmin(session.user.role)) {
        router.push("/dashboard");
        return;
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    const derived = `${form.first_name} ${form.last_name}`.trim();
    setForm((f) => (f.full_name === derived ? f : { ...f, full_name: derived }));
  }, [form.first_name, form.last_name]);

  useEffect(() => {
    const name = form.full_name.trim() || `${form.first_name} ${form.last_name}`.trim();
    if (!name) return;
    const newSlug = toSlug(name);
    setForm((f) => (f.slug === newSlug ? f : { ...f, slug: newSlug }));
  }, [form.first_name, form.last_name, form.full_name]);

  const updateSlugFromName = () => {
    const name = form.full_name.trim() || `${form.first_name} ${form.last_name}`.trim();
    if (name && !form.slug) setForm((f) => ({ ...f, slug: toSlug(name) }));
  };

  const navigateToSection = (section: string) => {
    if (!openSections.includes(section)) {
      setOpenSections((prev) => [...prev, section]);
    }
    setTimeout(() => {
      const element = sectionRefs.current[section];
      if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleAddPendingReview = () => {
    if (!newReview.reviewer_name.trim() || !newReview.review_text.trim()) return;
    setPendingReviews((prev) => [
      ...prev,
      {
        reviewer_name: newReview.reviewer_name.trim(),
        rating: newReview.rating,
        review_text: newReview.review_text.trim(),
      },
    ]);
    setNewReview({ reviewer_name: "", rating: 5, review_text: "" });
  };

  const handleRemovePendingReview = (index: number) => {
    setPendingReviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fullName =
      form.full_name.trim() || `${form.first_name.trim()} ${form.last_name.trim()}`.trim();
    const slug = form.slug.trim() || toSlug(fullName);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          full_name: fullName,
          job_title: form.job_title.trim() || "Real Estate Agent",
          agent_type: form.agent_type,
          slug: slug || toSlug(form.first_name + " " + form.last_name),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          website_url: form.website_url.trim() || null,
          profile_image: form.profile_image.trim() || null,
          cover_image: form.cover_image.trim() || null,
          about_agent: form.about_agent.trim() || null,
          tagline: form.tagline.trim() || null,
          primary_focus: form.primary_focus.trim() || null,
          industry_role: form.industry_role.trim() || null,
          property_specialties: form.property_specialties,
          languages_spoken: form.languages_spoken
            .split(/[,;]/)
            .map((s) => s.trim())
            .filter(Boolean),
          status: form.status,
          linkedin: form.linkedin.trim() || undefined,
          facebook: form.facebook.trim() || undefined,
          instagram: form.instagram.trim() || undefined,
          twitter: form.twitter.trim() || undefined,
          youtube: form.youtube.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create agent");
      const agentSlug = data.agent?.slug ?? slug;
      if (pendingReviews.length > 0 && agentSlug) {
        for (const review of pendingReviews) {
          const reviewRes = await fetch(
            `/api/admin/agents/${encodeURIComponent(agentSlug)}/reviews`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                reviewer_name: review.reviewer_name,
                rating: review.rating,
                review_text: review.review_text,
              }),
            }
          );
          const reviewData = await reviewRes.json().catch(() => ({}));
          if (!reviewRes.ok) {
            throw new Error(reviewData.error || "Failed to add a review");
          }
        }
      }
      router.push("/dashboard/admin/agents");
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setSubmitting(false);
    }
  };

  if (status !== "authenticated" || !session?.user) {
    return null;
  }

  return (
    <div className="space-y-6 relative pb-24 mt-16">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin/agents">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add New Agent</h1>
          <p className="text-sm text-muted-foreground">
            Create a new agent. Slug is used in the public URL.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Fixed section nav - below dashboard header */}
        <div
          className="fixed z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm"
          style={{ top: "64px", left: `${sidebarWidth}px`, right: "0px" }}
        >
          <div className="px-6 py-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {SECTIONS.map((section) => (
                <Button
                  key={section.id}
                  type="button"
                  variant={openSections.includes(section.id) ? "default" : "outline"}
                  onClick={() => navigateToSection(section.id)}
                  className="rounded-lg"
                >
                  {section.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="space-y-4"
        >
          {/* Basic Info */}
          <div ref={(el) => { sectionRefs.current["basic"] = el }}>
            <AccordionItem value="basic">
              <AccordionTrigger className="container text-lg font-semibold px-6">
                Basic Information
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 container">
                  <Card>
                    <CardHeader>
                      <CardTitle>Agent details</CardTitle>
                      <CardDescription>
                        Name, role, contact, images, and profile content.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="first_name">First name *</Label>
                          <Input
                            id="first_name"
                            value={form.first_name}
                            onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                            onBlur={updateSlugFromName}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last_name">Last name *</Label>
                          <Input
                            id="last_name"
                            value={form.last_name}
                            onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                            onBlur={updateSlugFromName}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full name (optional, auto from first + last)</Label>
                        <Input
                          id="full_name"
                          value={form.full_name}
                          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                          onBlur={updateSlugFromName}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="job_title">Agent Role *</Label>
                          <Input
                            id="job_title"
                            value={form.job_title}
                            onChange={(e) => setForm((f) => ({ ...f, job_title: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="agent_type">Agent type *</Label>
                          <Select
                            value={form.agent_type}
                            onValueChange={(v) =>
                              setForm((f) => ({ ...f, agent_type: v as "COMMERCIAL" | "RESIDENTIAL" | "BOTH" }))
                            }
                          >
                            <SelectTrigger id="agent_type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                              <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                              <SelectItem value="BOTH">Both</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slug">Slug (URL-friendly; auto from name if empty)</Label>
                        <Input
                          id="slug"
                          value={form.slug}
                          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                          placeholder="e.g. david-cohen"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={form.phone}
                            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website_url">Website URL</Label>
                        <Input
                          id="website_url"
                          type="url"
                          value={form.website_url}
                          onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profile_image">Profile image</Label>
                        <p className="text-xs text-muted-foreground">Paste or enter image URL</p>
                        <div className="flex gap-2">
                          <Input
                            id="profile_image"
                            placeholder="https://... or paste image URL"
                            value={form.profile_image}
                            onChange={(e) => setForm((f) => ({ ...f, profile_image: e.target.value }))}
                            onPaste={(e) => {
                              const pasted = e.clipboardData?.getData("text")?.trim();
                              if (pasted && isImageUrl(pasted)) {
                                e.preventDefault();
                                setForm((f) => ({ ...f, profile_image: pasted }));
                              }
                            }}
                            onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setForm((f) => ({ ...f, profile_image: "" }))}
                            className="shrink-0"
                            aria-label="Clear profile image"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {form.profile_image && (
                          <div className="relative border rounded-lg overflow-hidden w-24 h-24 border-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={form.profile_image}
                              alt="Profile preview"
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cover_image">Cover image (optional)</Label>
                        <p className="text-xs text-muted-foreground">Paste or enter image URL</p>
                        <div className="flex gap-2">
                          <Input
                            id="cover_image"
                            placeholder="https://... or paste image URL"
                            value={form.cover_image}
                            onChange={(e) => setForm((f) => ({ ...f, cover_image: e.target.value }))}
                            onPaste={(e) => {
                              const pasted = e.clipboardData?.getData("text")?.trim();
                              if (pasted && isImageUrl(pasted)) {
                                e.preventDefault();
                                setForm((f) => ({ ...f, cover_image: pasted }));
                              }
                            }}
                            onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setForm((f) => ({ ...f, cover_image: "" }))}
                            className="shrink-0"
                            aria-label="Clear cover image"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {form.cover_image && (
                          <div className="relative border rounded-lg overflow-hidden max-w-xs aspect-video border-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={form.cover_image}
                              alt="Cover preview"
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tagline">Tagline</Label>
                        <Input
                          id="tagline"
                          value={form.tagline}
                          onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="about_agent">About / Bio</Label>
                        <Textarea
                          id="about_agent"
                          value={form.about_agent}
                          onChange={(e) => setForm((f) => ({ ...f, about_agent: e.target.value }))}
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="primary_focus">Primary focus</Label>
                          <Input
                            id="primary_focus"
                            value={form.primary_focus}
                            onChange={(e) => setForm((f) => ({ ...f, primary_focus: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="industry_role">Industry role</Label>
                          <Input
                            id="industry_role"
                            value={form.industry_role}
                            onChange={(e) => setForm((f) => ({ ...f, industry_role: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Specialization</Label>
                        <p className="text-xs text-muted-foreground mb-2">Select all that apply</p>
                        <div className="flex flex-wrap gap-3">
                          {SPECIALIZATION_OPTIONS.map((opt) => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={form.property_specialties.includes(opt)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setForm((f) => ({
                                    ...f,
                                    property_specialties: checked
                                      ? [...f.property_specialties, opt]
                                      : f.property_specialties.filter((s) => s !== opt),
                                  }));
                                }}
                                className="rounded border-input"
                              />
                              <span className="text-sm">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="languages_spoken">Languages spoken (comma-separated)</Label>
                        <Input
                          id="languages_spoken"
                          value={form.languages_spoken}
                          onChange={(e) => setForm((f) => ({ ...f, languages_spoken: e.target.value }))}
                          placeholder="English, French"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={form.status}
                          onValueChange={(v) => setForm((f) => ({ ...f, status: v as "ACTIVE" | "INACTIVE" }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          </div>

          {/* Social Links */}
          <div ref={(el) => { sectionRefs.current["social"] = el }}>
            <AccordionItem value="social">
              <AccordionTrigger className="container text-lg font-semibold px-6">
                Social Links
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 container">
                  <Card>
                    <CardHeader>
                      <CardTitle>Social links (optional)</CardTitle>
                      <CardDescription>
                        LinkedIn, Facebook, Instagram, Twitter, YouTube.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="linkedin">LinkedIn</Label>
                          <Input
                            id="linkedin"
                            type="url"
                            value={form.linkedin}
                            onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="facebook">Facebook</Label>
                          <Input
                            id="facebook"
                            type="url"
                            value={form.facebook}
                            onChange={(e) => setForm((f) => ({ ...f, facebook: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="instagram">Instagram</Label>
                          <Input
                            id="instagram"
                            type="url"
                            value={form.instagram}
                            onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="twitter">Twitter</Label>
                          <Input
                            id="twitter"
                            type="url"
                            value={form.twitter}
                            onChange={(e) => setForm((f) => ({ ...f, twitter: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="youtube">YouTube</Label>
                          <Input
                            id="youtube"
                            type="url"
                            value={form.youtube}
                            onChange={(e) => setForm((f) => ({ ...f, youtube: e.target.value }))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          </div>

          {/* Testimonials / Reviews */}
          <div ref={(el) => { sectionRefs.current["reviews"] = el }}>
            <AccordionItem value="reviews">
              <AccordionTrigger className="container text-lg font-semibold px-6">
                Testimonials / Reviews
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 container">
                  <Card>
                    <CardHeader>
                      <CardTitle>Testimonials / Reviews</CardTitle>
                      <CardDescription>
                        Add reviews to show on the agent&apos;s public profile. They will be saved when you create the agent.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div
                        className="space-y-4 p-4 rounded-lg border border-border bg-muted/30"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddPendingReview();
                          }
                        }}
                      >
                        <h3 className="text-sm font-semibold">Add a review</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="new_review_name">Reviewer name</Label>
                            <Input
                              id="new_review_name"
                              value={newReview.reviewer_name}
                              onChange={(e) =>
                                setNewReview((r) => ({ ...r, reviewer_name: e.target.value }))
                              }
                              placeholder="e.g. John Smith"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new_review_rating">Rating (1–5)</Label>
                            <Select
                              value={String(newReview.rating)}
                              onValueChange={(v) =>
                                setNewReview((r) => ({ ...r, rating: parseInt(v, 10) }))
                              }
                            >
                              <SelectTrigger id="new_review_rating">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <SelectItem key={n} value={String(n)}>
                                    {n} {n === 1 ? "star" : "stars"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new_review_text">Review text</Label>
                          <Textarea
                            id="new_review_text"
                            value={newReview.review_text}
                            onChange={(e) =>
                              setNewReview((r) => ({ ...r, review_text: e.target.value }))
                            }
                            rows={3}
                            placeholder="What did the client say?"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAddPendingReview()}
                        >
                          Add review
                        </Button>
                      </div>

                      {pendingReviews.length > 0 ? (
                        <ul className="space-y-3">
                          {pendingReviews.map((review, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-3 p-4 rounded-lg border border-border bg-background"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{review.reviewer_name}</span>
                                  <span
                                    className="flex items-center gap-0.5 text-amber-600"
                                    aria-label={`${review.rating} stars`}
                                  >
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${i < review.rating ? "fill-amber-500" : "fill-muted"}`}
                                        aria-hidden
                                      />
                                    ))}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {review.review_text}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-destructive hover:text-destructive"
                                onClick={() => handleRemovePendingReview(index)}
                                aria-label={`Remove review by ${review.reviewer_name}`}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No reviews added yet. Add one above to show on the agent&apos;s profile after creation.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          </div>
        </Accordion>

        <div className="h-24" />

        {/* Fixed bottom action bar */}
        <div
          className="fixed bottom-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t shadow-lg"
          style={{ left: `${sidebarWidth}px`, right: "0px" }}
        >
          <div className="px-6 py-4">
            <div className="flex justify-between gap-4 max-w-7xl mx-auto items-center">
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/admin/agents">Cancel</Link>
              </Button>
              <Button type="submit" disabled={submitting} className="min-w-[120px]">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Agent"
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
