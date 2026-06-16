import { notFound } from "next/navigation";
import { ResourceAccess } from "@prisma/client";
import { getResourceForEdit } from "@/services/resources";
import { listResourceCategories } from "@/services/resource-categories";
import { ResourceForm, type ResourceFormInitial } from "@/components/admin/resource-form";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

type EditResource = NonNullable<Awaited<ReturnType<typeof getResourceForEdit>>>;

function mapToInitial(r: EditResource): ResourceFormInitial {
  return {
    title: r.title,
    slug: r.slug,
    type: r.type,
    categoryId: r.categoryId ?? "",
    description: r.description,
    excerpt: r.excerpt ?? "",
    author: r.author ?? "",
    access: r.access,
    priceRupees: r.access === ResourceAccess.PAID ? String(Math.round(r.pricePaise / 100)) : "",
    file: r.file
      ? { id: r.file.id, fileName: r.file.fileName, fileType: r.fileType ?? undefined, sizeBytes: r.file.size }
      : {},
    pageCount: r.pageCount ? String(r.pageCount) : "",
    previewImages: r.previewImages,
    tags: r.tags.map((t) => t.tag.name),
    abstract: r.abstract ?? "",
    citation: r.citation ?? "",
    doi: r.doi ?? "",
    publishedYear: r.publishedYear ? String(r.publishedYear) : "",
    metaTitle: r.metaTitle ?? "",
    metaDescription: r.metaDescription ?? "",
    ogImageUrl: r.ogImageUrl ?? "",
    featured: r.featured,
  };
}

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [resource, categories] = await Promise.all([
    getResourceForEdit(id),
    safe(listResourceCategories(), []),
  ]);
  if (!resource || resource.deletedAt) notFound();

  return (
    <ResourceForm
      mode="edit"
      resourceId={id}
      initial={mapToInitial(resource)}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
