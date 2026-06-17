import { notFound } from "next/navigation";
import { getBundleForEdit } from "@/services/bundles";
import { listSelectableResources } from "@/services/resources";
import { BundleForm, type BundleFormInitial } from "@/components/admin/bundle-form";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

type EditBundle = NonNullable<Awaited<ReturnType<typeof getBundleForEdit>>>;

function mapToInitial(b: EditBundle): BundleFormInitial {
  return {
    title: b.title,
    slug: b.slug,
    description: b.description,
    excerpt: b.excerpt ?? "",
    examType: b.examType ?? "",
    priceRupees: String(Math.round(b.pricePaise / 100)),
    coverImage: b.coverImage ?? "",
    previewImages: b.previewImages,
    resourceIds: b.items.map((i) => i.resourceId),
    metaTitle: b.metaTitle ?? "",
    metaDescription: b.metaDescription ?? "",
    ogImageUrl: b.ogImageUrl ?? "",
    featured: b.featured,
  };
}

export default async function EditBundlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [bundle, resources] = await Promise.all([getBundleForEdit(id), safe(listSelectableResources(), [])]);
  if (!bundle || bundle.deletedAt) notFound();

  return <BundleForm mode="edit" bundleId={id} initial={mapToInitial(bundle)} resources={resources} />;
}
