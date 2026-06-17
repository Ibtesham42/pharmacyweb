"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, ImagePlus, X } from "lucide-react";
import { ResourceType, ResourceAccess, ResourceStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { TagInput } from "@/components/admin/tag-input";
import {
  ResourceFileUploadField,
  type ResourceFileValue,
} from "@/components/admin/resource-file-upload-field";
import { ResourceAiTools } from "@/components/admin/resource-ai-tools";
import { uploadToCloudinary } from "@/lib/upload-client";
import { toSlug } from "@/lib/slug";
import { RESOURCE_TYPE_LABELS, RESOURCE_TYPES, RESEARCH_TYPES } from "@/lib/marketplace/config";
import { createResourceAction, updateResourceAction } from "@/app/admin/(panel)/resources/actions";

export interface ResourceFormInitial {
  title: string;
  slug: string;
  type: ResourceType;
  categoryId: string;
  description: string;
  excerpt: string;
  author: string;
  access: ResourceAccess;
  priceRupees: string;
  file: ResourceFileValue;
  pageCount: string;
  previewImages: string[];
  tags: string[];
  abstract: string;
  citation: string;
  doi: string;
  publishedYear: string;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
  featured: boolean;
}

export function emptyResourceInitial(type: ResourceType = ResourceType.PHARMACY_NOTES): ResourceFormInitial {
  return {
    title: "",
    slug: "",
    type,
    categoryId: "",
    description: "",
    excerpt: "",
    author: "",
    access: ResourceAccess.FREE,
    priceRupees: "",
    file: {},
    pageCount: "",
    previewImages: [],
    tags: [],
    abstract: "",
    citation: "",
    doi: "",
    publishedYear: "",
    metaTitle: "",
    metaDescription: "",
    ogImageUrl: "",
    featured: false,
  };
}

const NONE = "__none__";

export function ResourceForm({
  mode,
  resourceId,
  initial,
  categories,
}: {
  mode: "create" | "edit";
  resourceId?: string;
  initial: ResourceFormInitial;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [s, setS] = useState<ResourceFormInitial>(initial);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const previewRef = useRef<HTMLInputElement>(null);

  const storageKey = `resource-draft-${mode}-${resourceId ?? "new"}`;
  const restored = useRef(false);
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
  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(storageKey, JSON.stringify(s)), 1000);
    return () => clearTimeout(t);
  }, [s, storageKey]);

  function set<K extends keyof ResourceFormInitial>(k: K, v: ResourceFormInitial[K]) {
    setS((p) => ({ ...p, [k]: v }));
  }

  function onTitle(value: string) {
    setS((p) => ({ ...p, title: value, slug: slugTouched ? p.slug : toSlug(value) }));
  }

  async function onPreviewFiles(files: FileList) {
    setUploadingPreview(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 8)) {
        const m = await uploadToCloudinary(file);
        urls.push(m.url);
      }
      set("previewImages", [...s.previewImages, ...urls].slice(0, 8));
      toast.success("Preview image(s) added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingPreview(false);
    }
  }

  function buildPayload(status: ResourceStatus) {
    return {
      title: s.title,
      slug: s.slug,
      type: s.type,
      categoryId: s.categoryId,
      description: s.description,
      excerpt: s.excerpt,
      author: s.author,
      access: s.access,
      pricePaise: Math.round(Number(s.priceRupees || 0) * 100),
      status,
      fileId: s.file.id || "",
      fileType: s.file.fileType || "",
      fileSizeBytes: s.file.sizeBytes,
      pageCount: s.pageCount ? Number(s.pageCount) : undefined,
      previewImages: s.previewImages,
      tags: s.tags,
      metaTitle: s.metaTitle,
      metaDescription: s.metaDescription,
      ogImageUrl: s.ogImageUrl,
      abstract: s.abstract,
      citation: s.citation,
      doi: s.doi,
      publishedYear: s.publishedYear ? Number(s.publishedYear) : undefined,
      featured: s.featured,
    };
  }

  async function save(status: ResourceStatus) {
    if (s.title.trim().length < 3) return toast.error("Title is required");
    if (s.description.trim().length < 10) return toast.error("Add a description");
    if (s.access === ResourceAccess.PAID && Number(s.priceRupees || 0) < 1) {
      return toast.error("Set a price for paid resources");
    }
    if (s.access !== ResourceAccess.FREE && !s.file.id && status === ResourceStatus.PUBLISHED) {
      return toast.error("Upload the resource file before publishing");
    }
    setSaving(true);
    const payload = buildPayload(status);
    const res =
      mode === "edit" && resourceId
        ? await updateResourceAction(resourceId, payload)
        : await createResourceAction(payload);
    setSaving(false);
    if (!res.ok) return toast.error(res.error);
    localStorage.removeItem(storageKey);
    toast.success(status === ResourceStatus.PUBLISHED ? "Published" : "Saved");
    router.push("/admin/resources");
    router.refresh();
  }

  const isResearch = RESEARCH_TYPES.includes(s.type);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{mode === "edit" ? "Edit resource" : "New resource"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => save(ResourceStatus.DRAFT)} disabled={saving}>
            Save draft
          </Button>
          <Button onClick={() => save(ResourceStatus.PUBLISHED)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Publish
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="space-y-4 p-5">
              <Field label="Title">
                <Input value={s.title} onChange={(e) => onTitle(e.target.value)} />
              </Field>
              <Field label="Slug">
                <Input
                  value={s.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value);
                  }}
                  placeholder="auto-generated-from-title"
                />
              </Field>
              <Field label="Excerpt (short summary)">
                <Input value={s.excerpt} onChange={(e) => set("excerpt", e.target.value)} maxLength={300} />
              </Field>
              <Field label="Description">
                <MarkdownEditor value={s.description} onChange={(v) => set("description", v)} />
              </Field>
            </CardContent>
          </Card>

          <ResourceAiTools
            getSource={() => ({
              title: s.title,
              type: RESOURCE_TYPE_LABELS[s.type],
              text: [s.description, isResearch ? s.abstract : ""].filter(Boolean).join("\n\n"),
            })}
            attachedFile={{ id: s.file.id, name: s.file.fileName }}
            onExcerpt={(excerpt) => set("excerpt", excerpt.slice(0, 300))}
            onSeo={(seo) =>
              setS((p) => ({
                ...p,
                metaTitle: seo.metaTitle.slice(0, 120),
                metaDescription: seo.metaDescription.slice(0, 300),
              }))
            }
            onTags={(tags) => setS((p) => ({ ...p, tags: Array.from(new Set([...p.tags, ...tags])) }))}
            onAppendDescription={(md) =>
              setS((p) => ({ ...p, description: p.description ? `${p.description}\n\n${md}` : md }))
            }
          />

          {isResearch && (
            <Card>
              <CardContent className="space-y-4 p-5">
                <p className="text-sm font-semibold">Thesis / research details</p>
                <Field label="Abstract">
                  <Textarea value={s.abstract} onChange={(e) => set("abstract", e.target.value)} rows={4} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Citation">
                    <Input value={s.citation} onChange={(e) => set("citation", e.target.value)} />
                  </Field>
                  <Field label="DOI (optional)">
                    <Input value={s.doi} onChange={(e) => set("doi", e.target.value)} placeholder="10.xxxx/xxxxx" />
                  </Field>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-4 p-5">
              <p className="text-sm font-semibold">SEO</p>
              <Field label="Meta title">
                <Input value={s.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} maxLength={120} />
              </Field>
              <Field label="Meta description">
                <Textarea
                  value={s.metaDescription}
                  onChange={(e) => set("metaDescription", e.target.value)}
                  rows={2}
                  maxLength={300}
                />
              </Field>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <Field label="Type">
                <Select value={s.type} onValueChange={(v) => set("type", v as ResourceType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {RESOURCE_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Category">
                <Select
                  value={s.categoryId || NONE}
                  onValueChange={(v) => set("categoryId", v === NONE ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Uncategorised" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Uncategorised</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Author (optional)">
                <Input value={s.author} onChange={(e) => set("author", e.target.value)} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <Field label="Access">
                <Select value={s.access} onValueChange={(v) => set("access", v as ResourceAccess)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free download</SelectItem>
                    <SelectItem value="PAID">Paid download</SelectItem>
                    <SelectItem value="PREMIUM">Premium (members only)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {s.access === ResourceAccess.PAID && (
                <Field label="Price (₹)">
                  <Input
                    type="number"
                    min={1}
                    value={s.priceRupees}
                    onChange={(e) => set("priceRupees", e.target.value)}
                  />
                </Field>
              )}
              {s.access === ResourceAccess.PREMIUM && (
                <p className="text-xs text-muted-foreground">
                  Premium memberships are not sold yet — this resource will show as members-only.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <Field label="Downloadable file">
                <ResourceFileUploadField value={s.file} onChange={(v) => set("file", v)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="File type">
                  <Input value={s.file.fileType || ""} disabled placeholder="—" />
                </Field>
                <Field label="Pages (optional)">
                  <Input
                    type="number"
                    value={s.pageCount}
                    onChange={(e) => set("pageCount", e.target.value)}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <Label>Preview images</Label>
              <div className="flex flex-wrap gap-2">
                {s.previewImages.map((url) => (
                  <span key={url} className="relative h-16 w-16 overflow-hidden rounded border">
                    <Image src={url} alt="Preview" fill className="object-cover" sizes="64px" unoptimized />
                    <button
                      type="button"
                      onClick={() => set("previewImages", s.previewImages.filter((u) => u !== url))}
                      className="absolute right-0 top-0 bg-black/60 p-0.5 text-white"
                      aria-label="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                ref={previewRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files?.length) void onPreviewFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingPreview || s.previewImages.length >= 8}
                onClick={() => previewRef.current?.click()}
              >
                {uploadingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                Add preview image
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <Label>Tags</Label>
              <TagInput value={s.tags} onChange={(v) => set("tags", v)} />
              <label className="flex items-center justify-between gap-3 pt-2">
                <span className="text-sm">Featured</span>
                <Switch checked={s.featured} onCheckedChange={(v) => set("featured", v)} />
              </label>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
