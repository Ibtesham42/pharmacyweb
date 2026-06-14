"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { PostType, PostStatus } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { TagInput } from "@/components/admin/tag-input";
import { ReferencesInput } from "@/components/admin/references-input";
import { toSlug } from "@/lib/slug";
import { JOB_TYPE_LABELS } from "@/lib/format";
import type { PostFormInitial, JobFields } from "@/lib/post-form-types";
import { createPostAction, updatePostAction } from "@/app/admin/(panel)/posts/actions";

const NONE = "__none__";

export function PostForm({
  mode,
  postId,
  initial,
  categories,
  states,
}: {
  mode: "create" | "edit";
  postId?: string;
  initial: PostFormInitial;
  categories: { id: string; name: string }[];
  states: { state: string; cities: string[] }[];
}) {
  const router = useRouter();
  const [s, setS] = useState<PostFormInitial>(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const storageKey = mode === "edit" ? `post:${postId}` : `post:new:${initial.type}`;
  const restored = useRef(false);

  // Restore an unsaved local draft (create mode only).
  useEffect(() => {
    if (mode === "create" && !restored.current) {
      restored.current = true;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        try {
          setS(JSON.parse(raw));
          toast.info("Restored your unsaved draft");
        } catch {
          /* ignore */
        }
      }
    }
  }, [mode, storageKey]);

  // Autosave to localStorage (debounced).
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(s));
      setSavedAt(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearTimeout(t);
  }, [s, storageKey]);

  const cities = useMemo(
    () => states.find((x) => x.state === s.job.state)?.cities ?? [],
    [states, s.job.state],
  );

  function set<K extends keyof PostFormInitial>(key: K, value: PostFormInitial[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
  }
  function setJob<K extends keyof JobFields>(key: K, value: JobFields[K]) {
    setS((prev) => ({ ...prev, job: { ...prev.job, [key]: value } }));
  }

  function onTitle(value: string) {
    setS((prev) => ({
      ...prev,
      title: value,
      slug: slugTouched ? prev.slug : toSlug(value),
    }));
  }

  function buildPayload(status: PostStatus) {
    return {
      type: s.type,
      title: s.title,
      slug: s.slug || undefined,
      excerpt: s.excerpt || undefined,
      content: s.content,
      status,
      isFeatured: s.isFeatured,
      categoryId: s.categoryId || undefined,
      featuredImageId: s.featuredImage.id || undefined,
      scheduledAt: status === "SCHEDULED" && s.scheduledAt ? s.scheduledAt : undefined,
      tags: s.tags,
      references: s.references.filter((r) => r.label && r.url),
      seo: {
        metaTitle: s.seo.metaTitle || undefined,
        metaDescription: s.seo.metaDescription || undefined,
        ogImageUrl: s.seo.ogImageUrl || undefined,
        keywords: s.seo.keywords.split(",").map((k) => k.trim()).filter(Boolean),
        noindex: s.seo.noindex,
      },
      jobDetail:
        s.type === "JOB"
          ? {
              companyName: s.job.companyName,
              companyWebsite: s.job.companyWebsite || undefined,
              city: s.job.city || undefined,
              state: s.job.state || undefined,
              jobType: s.job.jobType,
              salaryMin: s.job.salaryMin ? Number(s.job.salaryMin) : undefined,
              salaryMax: s.job.salaryMax ? Number(s.job.salaryMax) : undefined,
              salaryText: s.job.salaryText || undefined,
              applyUrl: s.job.applyUrl,
              experienceLevel: s.job.experienceLevel || undefined,
              qualifications: s.job.qualifications || undefined,
              expiryDate: s.job.expiryDate || undefined,
            }
          : undefined,
    };
  }

  async function save(status: PostStatus) {
    if (!s.title.trim()) return toast.error("Title is required");
    if (!s.content.trim()) return toast.error("Content is required");
    if (s.type === "JOB" && (!s.job.companyName || !s.job.applyUrl)) {
      return toast.error("Jobs need a company name and application link");
    }
    setSaving(true);
    const payload = buildPayload(status);
    const res =
      mode === "edit" && postId
        ? await updatePostAction(postId, payload)
        : await createPostAction(payload);
    setSaving(false);
    if (!res.ok) return toast.error(res.error);
    localStorage.removeItem(storageKey);
    toast.success(status === "PUBLISHED" ? "Published" : status === "SCHEDULED" ? "Scheduled" : "Saved");
    set("status", status);
    router.push("/admin/posts");
    router.refresh();
  }

  const primaryLabel = s.status === "SCHEDULED" ? "Schedule" : "Publish";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{mode === "edit" ? "Edit post" : "New post"}</h1>
          {savedAt && <p className="text-xs text-muted-foreground">Draft autosaved locally at {savedAt}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => save("DRAFT")} disabled={saving}>
            Save draft
          </Button>
          <Button onClick={() => save(s.status === "SCHEDULED" ? "SCHEDULED" : "PUBLISHED")} disabled={saving}>
            {saving ? "Saving…" : primaryLabel}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={s.title} onChange={(e) => onTitle(e.target.value)} placeholder="Post title" />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={s.type} onValueChange={(v) => set("type", v as PostType)} disabled={mode === "edit"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JOB">Job</SelectItem>
                      <SelectItem value="ARTICLE">Article</SelectItem>
                      <SelectItem value="NEWS">News</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={s.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", toSlug(e.target.value));
                  }}
                  placeholder="auto-generated-from-title"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={s.excerpt}
                  onChange={(e) => set("excerpt", e.target.value)}
                  rows={2}
                  placeholder="Short summary shown in cards and search results"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <Tabs defaultValue="content">
                <TabsList className="flex-wrap">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  {s.type === "JOB" && <TabsTrigger value="job">Job details</TabsTrigger>}
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="pt-4">
                  <MarkdownEditor value={s.content} onChange={(v) => set("content", v)} />
                </TabsContent>

                {s.type === "JOB" && (
                  <TabsContent value="job" className="space-y-4 pt-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Company name" required>
                        <Input value={s.job.companyName} onChange={(e) => setJob("companyName", e.target.value)} />
                      </Field>
                      <Field label="Company website">
                        <Input value={s.job.companyWebsite} onChange={(e) => setJob("companyWebsite", e.target.value)} placeholder="https://…" />
                      </Field>
                      <Field label="State">
                        <Select value={s.job.state || NONE} onValueChange={(v) => { setJob("state", v === NONE ? "" : v); setJob("city", ""); }}>
                          <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>—</SelectItem>
                            {states.map((x) => <SelectItem key={x.state} value={x.state}>{x.state}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="City">
                        <Select value={s.job.city || NONE} onValueChange={(v) => setJob("city", v === NONE ? "" : v)} disabled={!s.job.state}>
                          <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>—</SelectItem>
                            {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Job type">
                        <Select value={s.job.jobType} onValueChange={(v) => setJob("jobType", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(JOB_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Apply URL" required>
                        <Input value={s.job.applyUrl} onChange={(e) => setJob("applyUrl", e.target.value)} placeholder="https://…" />
                      </Field>
                      <Field label="Salary min (₹/yr)">
                        <Input type="number" value={s.job.salaryMin} onChange={(e) => setJob("salaryMin", e.target.value)} />
                      </Field>
                      <Field label="Salary max (₹/yr)">
                        <Input type="number" value={s.job.salaryMax} onChange={(e) => setJob("salaryMax", e.target.value)} />
                      </Field>
                      <Field label="Salary text (optional)">
                        <Input value={s.job.salaryText} onChange={(e) => setJob("salaryText", e.target.value)} placeholder="e.g. Negotiable" />
                      </Field>
                      <Field label="Experience level">
                        <Input value={s.job.experienceLevel} onChange={(e) => setJob("experienceLevel", e.target.value)} placeholder="e.g. 1-3 years" />
                      </Field>
                      <Field label="Qualifications">
                        <Input value={s.job.qualifications} onChange={(e) => setJob("qualifications", e.target.value)} placeholder="e.g. B.Pharm" />
                      </Field>
                      <Field label="Expiry date">
                        <Input type="date" value={s.job.expiryDate} onChange={(e) => setJob("expiryDate", e.target.value)} />
                      </Field>
                    </div>
                  </TabsContent>
                )}

                <TabsContent value="seo" className="space-y-4 pt-4">
                  <Field label="Meta title">
                    <Input value={s.seo.metaTitle} onChange={(e) => set("seo", { ...s.seo, metaTitle: e.target.value })} maxLength={70} placeholder={s.title} />
                  </Field>
                  <Field label="Meta description">
                    <Textarea value={s.seo.metaDescription} onChange={(e) => set("seo", { ...s.seo, metaDescription: e.target.value })} maxLength={180} rows={2} placeholder={s.excerpt} />
                  </Field>
                  <Field label="OG image URL">
                    <Input value={s.seo.ogImageUrl} onChange={(e) => set("seo", { ...s.seo, ogImageUrl: e.target.value })} placeholder="https://…" />
                  </Field>
                  <Field label="Keywords (comma separated)">
                    <Input value={s.seo.keywords} onChange={(e) => set("seo", { ...s.seo, keywords: e.target.value })} placeholder="pharmacy job, chennai" />
                  </Field>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={s.seo.noindex} onCheckedChange={(v) => set("seo", { ...s.seo, noindex: v })} />
                    Hide from search engines (noindex)
                  </label>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {(s.type === "ARTICLE" || s.type === "NEWS") && (
            <Card>
              <CardContent className="space-y-2 p-5">
                <Label>References</Label>
                <ReferencesInput value={s.references} onChange={(v) => set("references", v)} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={s.status} onValueChange={(v) => set("status", v as PostStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {s.status === "SCHEDULED" && (
                <Field label="Publish at">
                  <Input type="datetime-local" value={s.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} />
                </Field>
              )}
              <label className="flex items-center justify-between text-sm">
                Featured
                <Switch checked={s.isFeatured} onCheckedChange={(v) => set("isFeatured", v)} />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-1.5 p-5">
              <Label>Category</Label>
              <Select value={s.categoryId || NONE} onValueChange={(v) => set("categoryId", v === NONE ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Uncategorized</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 p-5">
              <Label>Tags</Label>
              <TagInput value={s.tags} onChange={(v) => set("tags", v)} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 p-5">
              <Label>Featured image</Label>
              <ImageUploadField value={s.featuredImage} onChange={(v) => set("featuredImage", v)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
