"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, Loader2, X } from "lucide-react";
import { isAdmin } from "@/lib/roles";

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

type FormShape = {
  first_name: string;
  last_name: string;
  full_name: string;
  job_title: string;
  agent_type: "COMMERCIAL" | "RESIDENTIAL" | "BOTH";
  slug: string;
  sort_order: string;
  email: string;
  phone: string;
  website_url: string;
  profile_image: string;
  cover_image: string;
  about_agent: string;
  tagline: string;
  primary_focus: string;
  industry_role: string;
  property_specialties: string;
  languages_spoken: string;
  status: "ACTIVE" | "INACTIVE";
  allow_contact_form: boolean;
  allow_reviews: boolean;
  response_time: string;
  verified_agent: boolean;
  years_experience: string;
  total_properties_sold: string;
  active_listings_count: string;
  service_areas: string;
  linkedin: string;
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
};

const emptyForm: FormShape = {
  first_name: "",
  last_name: "",
  full_name: "",
  job_title: "Real Estate Agent",
  agent_type: "RESIDENTIAL",
  slug: "",
  sort_order: "0",
  email: "",
  phone: "",
  website_url: "",
  profile_image: "",
  cover_image: "",
  about_agent: "",
  tagline: "",
  primary_focus: "",
  industry_role: "",
  property_specialties: "",
  languages_spoken: "",
  status: "ACTIVE",
  allow_contact_form: true,
  allow_reviews: true,
  response_time: "",
  verified_agent: false,
  years_experience: "0",
  total_properties_sold: "0",
  active_listings_count: "0",
  service_areas: "",
  linkedin: "",
  facebook: "",
  instagram: "",
  twitter: "",
  youtube: "",
};

export default function EditAgentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = (params?.id ?? params?.slug ?? (params && Object.values(params)[0])) as string | undefined;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profilePreviewError, setProfilePreviewError] = useState(false);
  const [coverPreviewError, setCoverPreviewError] = useState(false);
  // Single source of truth: null until API returns; then form data. Form only renders when this is set.
  const [formData, setFormData] = useState<FormShape | null>(null);

  const loadedSlugRef = useRef<string | null>(null);

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

  // Reset image preview error when URL changes so we retry loading
  useEffect(() => {
    setProfilePreviewError(false);
  }, [formData?.profile_image]);
  useEffect(() => {
    setCoverPreviewError(false);
  }, [formData?.cover_image]);

  // Fetch agent when slug is available and only when it's a different agent (same pattern as pre-con edit)
  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    if (status !== "authenticated") return;

    if (loadedSlugRef.current !== slug) {
      setFormData(null);
      loadedSlugRef.current = slug;
      fetchAgent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, status]);

  const fetchAgent = async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/agents/${encodeURIComponent(slug)}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("Failed to load agent");
      const data = await res.json();
      const agent = data?.agent ?? data;
      if (!agent || typeof agent !== "object") {
        setError("Agent not found");
        setLoading(false);
        return;
      }

      const social = agent.social_links && typeof agent.social_links === "object" ? agent.social_links : {};
      const specs = agent.property_specialties;
      const langs = agent.languages_spoken;

      const serviceAreas = agent.service_areas;
      const areasStr = Array.isArray(serviceAreas)
        ? serviceAreas.map((a: string) => String(a).trim()).filter(Boolean).join(", ")
        : "";

      const nextForm: FormShape = {
        first_name: String(agent.first_name ?? "").trim(),
        last_name: String(agent.last_name ?? "").trim(),
        full_name: String(agent.full_name ?? "").trim(),
        job_title: String(agent.job_title ?? "Real Estate Agent").trim(),
        agent_type: (agent.agent_type ?? "RESIDENTIAL") as "COMMERCIAL" | "RESIDENTIAL" | "BOTH",
        slug: String(agent.slug ?? "").trim(),
        sort_order: agent.sort_order != null ? String(agent.sort_order) : "0",
        email: String(agent.email ?? "").trim(),
        phone: String(agent.phone ?? "").trim(),
        website_url: String(agent.website_url ?? "").trim(),
        profile_image: String(agent.profile_image ?? "").trim(),
        cover_image: String(agent.cover_image ?? "").trim(),
        about_agent: String(agent.about_agent ?? "").trim(),
        tagline: String(agent.tagline ?? "").trim(),
        primary_focus: String(agent.primary_focus ?? "").trim(),
        industry_role: String(agent.industry_role ?? "").trim(),
        property_specialties: Array.isArray(specs) ? specs.map((s) => String(s).trim()).filter(Boolean).join(", ") : "",
        languages_spoken: Array.isArray(langs) ? langs.map((l) => String(l).trim()).filter(Boolean).join(", ") : "",
        status: (agent.status === "INACTIVE" ? "INACTIVE" : "ACTIVE") as "ACTIVE" | "INACTIVE",
        allow_contact_form: agent.allow_contact_form !== false,
        allow_reviews: agent.allow_reviews !== false,
        response_time: String(agent.response_time ?? "").trim(),
        verified_agent: agent.verified_agent === true,
        years_experience: agent.years_experience != null ? String(agent.years_experience) : "0",
        total_properties_sold: agent.total_properties_sold != null ? String(agent.total_properties_sold) : "0",
        active_listings_count: agent.active_listings_count != null ? String(agent.active_listings_count) : "0",
        service_areas: areasStr,
        linkedin: String((social as { linkedin?: string }).linkedin ?? "").trim(),
        facebook: String((social as { facebook?: string }).facebook ?? "").trim(),
        instagram: String((social as { instagram?: string }).instagram ?? "").trim(),
        twitter: String((social as { twitter?: string }).twitter ?? "").trim(),
        youtube: String((social as { youtube?: string }).youtube ?? "").trim(),
      };

      setFormData(nextForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agent");
    } finally {
      setLoading(false);
    }
  };

  const updateSlugFromName = () => {
    if (!formData) return;
    const name = formData.full_name.trim() || `${formData.first_name} ${formData.last_name}`.trim();
    if (name && !formData.slug) setFormData((f) => (f ? { ...f, slug: toSlug(name) } : f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !formData) return;
    setError(null);
    setSubmitting(true);

    const fullName =
      formData.full_name.trim() || `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim();
    const newSlug = formData.slug.trim() || toSlug(fullName);

    try {
      const res = await fetch(`/api/admin/agents/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          full_name: fullName,
          job_title: formData.job_title.trim() || "Real Estate Agent",
          agent_type: formData.agent_type,
          slug: newSlug || toSlug(formData.first_name + " " + formData.last_name),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          website_url: formData.website_url.trim() || null,
          profile_image: formData.profile_image.trim() || null,
          cover_image: formData.cover_image.trim() || null,
          about_agent: formData.about_agent.trim() || null,
          tagline: formData.tagline.trim() || null,
          primary_focus: formData.primary_focus.trim() || null,
          industry_role: formData.industry_role.trim() || null,
          property_specialties: formData.property_specialties
            .split(/[,;]/)
            .map((s) => s.trim())
            .filter(Boolean),
          languages_spoken: formData.languages_spoken
            .split(/[,;]/)
            .map((s) => s.trim())
            .filter(Boolean),
          status: formData.status,
          sort_order: parseInt(formData.sort_order, 10) || 0,
          allow_contact_form: formData.allow_contact_form,
          allow_reviews: formData.allow_reviews,
          response_time: formData.response_time.trim() || null,
          verified_agent: formData.verified_agent,
          years_experience: parseInt(formData.years_experience, 10) || 0,
          total_properties_sold: parseInt(formData.total_properties_sold, 10) || 0,
          active_listings_count: parseInt(formData.active_listings_count, 10) || 0,
          service_areas: formData.service_areas
            .split(/[,;]/)
            .map((s) => s.trim())
            .filter(Boolean),
          linkedin: formData.linkedin.trim() || undefined,
          facebook: formData.facebook.trim() || undefined,
          instagram: formData.instagram.trim() || undefined,
          twitter: formData.twitter.trim() || undefined,
          youtube: formData.youtube.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to update agent");
      }

      router.push("/dashboard/admin/agents");
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update agent");
    } finally {
      setSubmitting(false);
    }
  };

  if (status !== "authenticated" || !session?.user) {
    return null;
  }

  if (!slug) {
    return (
      <div className="space-y-6">
        <p className="text-destructive">Invalid agent.</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/admin/agents">Back to Agents</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="space-y-6">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/admin/agents">Back to Agents</Link>
        </Button>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin/agents">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Agent</h1>
          <p className="text-sm text-muted-foreground">
            Update agent details. Slug is used in the public URL (/our-agents/{formData.slug || "slug"}).
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Agent details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData((f) => (f ? { ...f, first_name: e.target.value } : f))
                  }
                  onBlur={updateSlugFromName}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData((f) => (f ? { ...f, last_name: e.target.value } : f))
                  }
                  onBlur={updateSlugFromName}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full name (optional)</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((f) => (f ? { ...f, full_name: e.target.value } : f))
                }
                onBlur={updateSlugFromName}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job_title">Job title *</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) =>
                    setFormData((f) => (f ? { ...f, job_title: e.target.value } : f))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent_type">Agent type *</Label>
                <Select
                  value={formData.agent_type}
                  onValueChange={(v) =>
                    setFormData((f) => (f ? {
                      ...f,
                      agent_type: v as "COMMERCIAL" | "RESIDENTIAL" | "BOTH",
                    } : f))
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL-friendly)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((f) => (f ? { ...f, slug: e.target.value } : f))
                  }
                  placeholder="e.g. david-cohen"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  min={0}
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData((f) => (f ? { ...f, sort_order: e.target.value } : f))
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((f) => (f ? { ...f, email: e.target.value } : f))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((f) => (f ? { ...f, phone: e.target.value } : f))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) =>
                  setFormData((f) => (f ? { ...f, website_url: e.target.value } : f))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile_image">Profile image</Label>
              <div className="flex gap-2">
                <Input
                  id="profile_image"
                  placeholder="https://... or paste image URL"
                  value={formData.profile_image}
                  onChange={(e) =>
                    setFormData((f) => (f ? { ...f, profile_image: e.target.value } : f))
                  }
                  onPaste={(e) => {
                    const pasted = e.clipboardData?.getData("text")?.trim();
                    if (pasted && isImageUrl(pasted)) {
                      e.preventDefault();
                      setFormData((f) => (f ? { ...f, profile_image: pasted } : f));
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setFormData((f) => (f ? { ...f, profile_image: "" } : f))}
                  className="shrink-0"
                  aria-label="Clear profile image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {formData.profile_image && (
                <div className="relative border rounded-lg overflow-hidden w-24 h-24 border-border bg-muted/30 flex items-center justify-center">
                  {!profilePreviewError && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={formData.profile_image}
                      alt="Profile preview"
                      className="w-full h-full object-cover absolute inset-0"
                      onError={() => setProfilePreviewError(true)}
                    />
                  )}
                  {profilePreviewError && (
                    <span className="text-xs text-center text-muted-foreground p-1" aria-live="polite">
                      Preview unavailable
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover_image">Cover image (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="cover_image"
                  placeholder="https://..."
                  value={formData.cover_image}
                  onChange={(e) =>
                    setFormData((f) => (f ? { ...f, cover_image: e.target.value } : f))
                  }
                  onPaste={(e) => {
                    const pasted = e.clipboardData?.getData("text")?.trim();
                    if (pasted && isImageUrl(pasted)) {
                      e.preventDefault();
                      setFormData((f) => (f ? { ...f, cover_image: pasted } : f));
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setFormData((f) => (f ? { ...f, cover_image: "" } : f))}
                  className="shrink-0"
                  aria-label="Clear cover image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {formData.cover_image && (
                <div className="relative border rounded-lg overflow-hidden max-w-xs aspect-video border-border bg-muted/30 flex items-center justify-center">
                  {!coverPreviewError && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={formData.cover_image}
                      alt="Cover preview"
                      className="w-full h-full object-cover absolute inset-0"
                      onError={() => setCoverPreviewError(true)}
                    />
                  )}
                  {coverPreviewError && (
                    <span className="text-xs text-center text-muted-foreground p-2" aria-live="polite">
                      Preview unavailable
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) =>
                  setFormData((f) => (f ? { ...f, tagline: e.target.value } : f))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="about_agent">About / Bio</Label>
              <Textarea
                id="about_agent"
                value={formData.about_agent}
                onChange={(e) =>
                  setFormData((f) => (f ? { ...f, about_agent: e.target.value } : f))
                }
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_focus">Primary focus</Label>
                <Input
                  id="primary_focus"
                  value={formData.primary_focus}
                  onChange={(e) =>
                    setFormData((f) => (f ? { ...f, primary_focus: e.target.value } : f))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry_role">Industry role</Label>
                <Input
                  id="industry_role"
                  value={formData.industry_role}
                  onChange={(e) =>
                    setFormData((f) => (f ? { ...f, industry_role: e.target.value } : f))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_specialties">
                Property specialties (comma-separated)
              </Label>
              <Input
                id="property_specialties"
                value={formData.property_specialties}
                onChange={(e) =>
                  setFormData((f) => (f ? {
                    ...f,
                    property_specialties: e.target.value,
                  } : f))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="languages_spoken">
                Languages spoken (comma-separated)
              </Label>
              <Input
                id="languages_spoken"
                value={formData.languages_spoken}
                onChange={(e) =>
                  setFormData((f) => (f ? {
                    ...f,
                    languages_spoken: e.target.value,
                  } : f))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) =>
                  setFormData((f) => (f ? {
                    ...f,
                    status: v as "ACTIVE" | "INACTIVE",
                  } : f))
                }
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

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>CTA &amp; engagement</CardTitle>
            <p className="text-sm text-muted-foreground">
              Contact form, reviews, response time, and verified badge.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.allow_contact_form}
                  onCheckedChange={(checked) =>
                    setFormData((f) => (f ? { ...f, allow_contact_form: checked === true } : f))
                  }
                  aria-label="Allow contact form"
                />
                <span className="text-sm">Allow contact form</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.allow_reviews}
                  onCheckedChange={(checked) =>
                    setFormData((f) => (f ? { ...f, allow_reviews: checked === true } : f))
                  }
                  aria-label="Allow reviews"
                />
                <span className="text-sm">Allow reviews</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.verified_agent}
                  onCheckedChange={(checked) =>
                    setFormData((f) => (f ? { ...f, verified_agent: checked === true } : f))
                  }
                  aria-label="Verified agent (Top 1% Producer badge)"
                />
                <span className="text-sm font-medium">Verified agent</span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              When &quot;Verified agent&quot; is checked, the agent&apos;s public profile shows the &quot;Top 1% Producer&quot; badge in the right column. Save this form after changing it.
            </p>
            <div className="space-y-2">
              <Label htmlFor="response_time">Response time</Label>
              <Input
                id="response_time"
                value={formData.response_time}
                onChange={(e) =>
                  setFormData((f) => (f ? { ...f, response_time: e.target.value } : f))
                }
                placeholder="e.g. Within 24 hours"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Stats</CardTitle>
            <p className="text-sm text-muted-foreground">
              Years of experience, properties sold, active listings.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="years_experience">Years experience</Label>
                <Input
                  id="years_experience"
                  type="number"
                  min={0}
                  value={formData.years_experience}
                  onChange={(e) =>
                    setFormData((f) => (f ? { ...f, years_experience: e.target.value } : f))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_properties_sold">Total properties sold</Label>
                <Input
                  id="total_properties_sold"
                  type="number"
                  min={0}
                  value={formData.total_properties_sold}
                  onChange={(e) =>
                    setFormData((f) => (f ? { ...f, total_properties_sold: e.target.value } : f))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="active_listings_count">Active listings count</Label>
                <Input
                  id="active_listings_count"
                  type="number"
                  min={0}
                  value={formData.active_listings_count}
                  onChange={(e) =>
                    setFormData((f) => (f ? { ...f, active_listings_count: e.target.value } : f))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_areas">Areas served (comma-separated)</Label>
              <Input
                id="service_areas"
                value={formData.service_areas}
                onChange={(e) =>
                  setFormData((f) => (f ? { ...f, service_areas: e.target.value } : f))
                }
                placeholder="e.g. Toronto, Mississauga, Brampton"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Social links (optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) =>
                    setFormData((f) => (f ? { ...f, linkedin: e.target.value } : f))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  type="url"
                  value={formData.facebook}
                  onChange={(e) =>
                    setFormData((f) => (f ? { ...f, facebook: e.target.value } : f))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  type="url"
                  value={formData.instagram}
                  onChange={(e) =>
                    setFormData((f) => (f ? { ...f, instagram: e.target.value } : f))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  type="url"
                  value={formData.twitter}
                  onChange={(e) =>
                    setFormData((f) => (f ? { ...f, twitter: e.target.value } : f))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube</Label>
                <Input
                  id="youtube"
                  type="url"
                  value={formData.youtube}
                  onChange={(e) =>
                    setFormData((f) => (f ? { ...f, youtube: e.target.value } : f))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/admin/agents">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
