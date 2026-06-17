"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, ImagePlus, X } from "lucide-react";
import { ResourceStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { uploadToCloudinary } from "@/lib/upload-client";
import { toSlug } from "@/lib/slug";
import { formatINR } from "@/lib/format";
import { RESOURCE_TYPE_LABELS } from "@/lib/marketplace/config";
import { createBundleAction, updateBundleAction } from "@/app/admin/(panel)/resources/bundles/actions";

export interface BundleFormInitial {
  title: string;
  slug: string;
  description: string;
  excerpt: string;
  examType: string;
  priceRupees: string;
  coverImage: string;
  previewImages: string[];
  resourceIds: string[];
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
  featured: boolean;
}

export function emptyBundleInitial(): BundleFormInitial {
  return {
    title: "",
    slug: "",
    description: "",
    excerpt: "",
    examType: "",
    priceRupees: "",
    coverImage: "",
    previewImages: [],
    resourceIds: [],
    metaTitle: "",
    metaDescription: "",
    ogImageUrl: "",
    featured: false,
  };
}

type ResourceOption = { id: string; title: string; type: string; access: string; pricePaise: number };

export function BundleForm({
  mode,
  bundleId,
  initial,
  resources,
}: {
  mode: "create" | "edit";
  bundleId?: string;
  initial: BundleFormInitial;
  resources: ResourceOption[];
}) {
  const router = useRouter();
  const [s, setS] = useState<BundleFormInitial>(initial);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [q, setQ] = useState("");

  function set<K extends keyof BundleFormInitial>(k: K, v: BundleFormInitial[K]) {
    setS((p) => ({ ...p, [k]: v }));
  }

  function onTitle(value: string) {
    setS((p) => ({ ...p, title: value, slug: slugTouched ? p.slug : toSlug(value) }));
  }

  function toggleResource(id: string) {
    setS((p) => ({
      ...p,
      resourceIds: p.resourceIds.includes(id)
        ? p.resourceIds.filter((x) => x !== id)
        : [...p.resourceIds, id],
    }));
  }

  const selectedValue = useMemo(() => {
    const byId = new Map(resources.map((r) => [r.id, r]));
    return s.resourceIds.reduce((sum, id) => {
      const r = byId.get(id);
      return sum + (r && r.access !== "FREE" ? r.pricePaise : 0);
    }, 0);
  }, [s.resourceIds, resources]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? resources.filter((r) => r.title.toLowerCase().includes(t)) : resources;
  }, [q, resources]);

  async function onCover(file: File) {
    setUploadingCover(true);
    try {
      const m = await uploadToCloudinary(file);
      set("coverImage", m.url);
      toast.success("Cover image added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingCover(false);
    }
  }

  function buildPayload(status: ResourceStatus) {
    return {
      title: s.title,
      slug: s.slug,
      description: s.description,
      excerpt: s.excerpt,
      examType: s.examType,
      pricePaise: Math.round(Number(s.priceRupees || 0) * 100),
      status,
      coverImage: s.coverImage,
      previewImages: s.previewImages,
      resourceIds: s.resourceIds,
      metaTitle: s.metaTitle,
      metaDescription: s.metaDescription,
      ogImageUrl: s.ogImageUrl,
      featured: s.featured,
    };
  }

  async function save(status: ResourceStatus) {
    if (s.title.trim().length < 3) return toast.error("Title is required");
    if (s.description.trim().length < 10) return toast.error("Add a description");
    if (Number(s.priceRupees || 0) < 1) return toast.error("Set a bundle price");
    if (s.resourceIds.length === 0) return toast.error("Add at least one resource to the bundle");
    setSaving(true);
    const payload = buildPayload(status);
    const res =
      mode === "edit" && bundleId
        ? await updateBundleAction(bundleId, payload)
        : await createBundleAction(payload);
    setSaving(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(status === ResourceStatus.PUBLISHED ? "Published" : "Saved");
    router.push("/admin/resources/bundles");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{mode === "edit" ? "Edit bundle" : "New bundle"}</h1>
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

          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Resources in this bundle</p>
                <span className="text-xs text-muted-foreground">
                  {s.resourceIds.length} selected · {formatINR(selectedValue)} value
                </span>
              </div>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search resources…" />
              <div className="max-h-80 space-y-1 overflow-y-auto rounded-md border p-2">
                {filtered.length === 0 ? (
                  <p className="p-3 text-center text-sm text-muted-foreground">No resources found.</p>
                ) : (
                  filtered.map((r) => (
                    <label
                      key={r.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        checked={s.resourceIds.includes(r.id)}
                        onChange={() => toggleResource(r.id)}
                        className="h-4 w-4"
                      />
                      <span className="flex-1 truncate">{r.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {RESOURCE_TYPE_LABELS[r.type as keyof typeof RESOURCE_TYPE_LABELS]} ·{" "}
                        {r.access === "FREE" ? "Free" : formatINR(r.pricePaise)}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

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

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <Field label="Price (₹)">
                <Input
                  type="number"
                  min={1}
                  value={s.priceRupees}
                  onChange={(e) => set("priceRupees", e.target.value)}
                />
              </Field>
              <Field label="Exam type (optional)">
                <Input value={s.examType} onChange={(e) => set("examType", e.target.value)} placeholder="e.g. GPAT" />
              </Field>
              <label className="flex items-center justify-between gap-3 pt-1">
                <span className="text-sm">Featured</span>
                <Switch checked={s.featured} onCheckedChange={(v) => set("featured", v)} />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <Label>Cover image</Label>
              {s.coverImage ? (
                <div className="relative aspect-[16/10] overflow-hidden rounded border">
                  <Image src={s.coverImage} alt="Cover" fill className="object-cover" sizes="320px" unoptimized />
                  <button
                    type="button"
                    onClick={() => set("coverImage", "")}
                    className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white"
                    aria-label="Remove cover"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground hover:border-primary">
                  {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  Upload cover
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      if (e.target.files?.[0]) void onCover(e.target.files[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
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
