"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

export default function NewAgentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    about_agent: "",
    tagline: "",
    primary_focus: "",
    industry_role: "",
    property_specialties: "",
    languages_spoken: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    linkedin: "",
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
  });

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

  // Auto-fill Full name from first + last as the user types
  useEffect(() => {
    const derived = `${form.first_name} ${form.last_name}`.trim();
    setForm((f) => (f.full_name === derived ? f : { ...f, full_name: derived }));
  }, [form.first_name, form.last_name]);

  // Auto-fill slug from full name (or first + last) as the user types, e.g. "John Doe" → "john-doe"
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
          property_specialties: form.property_specialties
            .split(/[,;]/)
            .map((s) => s.trim())
            .filter(Boolean),
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

      if (!res.ok) {
        throw new Error(data.error || "Failed to create agent");
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
    <div className="space-y-6">
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
                  value={form.first_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, first_name: e.target.value }))
                  }
                  onBlur={updateSlugFromName}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last name *</Label>
                <Input
                  id="last_name"
                  value={form.last_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, last_name: e.target.value }))
                  }
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, full_name: e.target.value }))
                }
                onBlur={updateSlugFromName}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job_title">Job title *</Label>
                <Input
                  id="job_title"
                  value={form.job_title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, job_title: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent_type">Agent type *</Label>
                <Select
                  value={form.agent_type}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      agent_type: v as "COMMERCIAL" | "RESIDENTIAL" | "BOTH",
                    }))
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                value={form.website_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, website_url: e.target.value }))
                }
              />
            </div>

            {/* Profile image – paste or enter URL + preview (PreCon-style) */}
            <div className="space-y-2">
              <Label htmlFor="profile_image">Profile image</Label>
              <p className="text-xs text-muted-foreground">
                Paste or enter image URL
              </p>
              <div className="flex gap-2">
                <Input
                  id="profile_image"
                  placeholder="https://... or paste image URL"
                  value={form.profile_image}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, profile_image: e.target.value }))
                  }
                  onPaste={(e) => {
                    const pasted = e.clipboardData?.getData("text")?.trim();
                    if (pasted && isImageUrl(pasted)) {
                      e.preventDefault();
                      setForm((f) => ({ ...f, profile_image: pasted }));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.preventDefault();
                  }}
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
                <div className="relative group border rounded-lg overflow-hidden w-24 h-24 border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.profile_image}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Cover image – paste or enter URL + preview */}
            <div className="space-y-2">
              <Label htmlFor="cover_image">Cover image (optional)</Label>
              <p className="text-xs text-muted-foreground">
                Paste or enter image URL
              </p>
              <div className="flex gap-2">
                <Input
                  id="cover_image"
                  placeholder="https://... or paste image URL"
                  value={form.cover_image}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cover_image: e.target.value }))
                  }
                  onPaste={(e) => {
                    const pasted = e.clipboardData?.getData("text")?.trim();
                    if (pasted && isImageUrl(pasted)) {
                      e.preventDefault();
                      setForm((f) => ({ ...f, cover_image: pasted }));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.preventDefault();
                  }}
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
                <div className="relative group border rounded-lg overflow-hidden max-w-xs aspect-video border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.cover_image}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={form.tagline}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tagline: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="about_agent">About / Bio</Label>
              <Textarea
                id="about_agent"
                value={form.about_agent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, about_agent: e.target.value }))
                }
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_focus">Primary focus</Label>
                <Input
                  id="primary_focus"
                  value={form.primary_focus}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, primary_focus: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry_role">Industry role</Label>
                <Input
                  id="industry_role"
                  value={form.industry_role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, industry_role: e.target.value }))
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
                value={form.property_specialties}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    property_specialties: e.target.value,
                  }))
                }
                placeholder="Luxury Homes, Waterfront, Commercial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="languages_spoken">
                Languages spoken (comma-separated)
              </Label>
              <Input
                id="languages_spoken"
                value={form.languages_spoken}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    languages_spoken: e.target.value,
                  }))
                }
                placeholder="English, French"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    status: v as "ACTIVE" | "INACTIVE",
                  }))
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
            <CardTitle>Social links (optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={form.linkedin}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, linkedin: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  type="url"
                  value={form.facebook}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, facebook: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  type="url"
                  value={form.instagram}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, instagram: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  type="url"
                  value={form.twitter}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, twitter: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube</Label>
                <Input
                  id="youtube"
                  type="url"
                  value={form.youtube}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, youtube: e.target.value }))
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
                Creating...
              </>
            ) : (
              "Create Agent"
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
