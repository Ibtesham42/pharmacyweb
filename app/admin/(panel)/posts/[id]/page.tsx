import { notFound } from "next/navigation";
import { getPostForEdit } from "@/services/posts";
import { listCategories } from "@/services/categories";
import { getLocations } from "@/services/settings";
import { PostForm } from "@/components/admin/post-form";
import { emptyInitial, type PostFormInitial } from "@/lib/post-form-types";

export const dynamic = "force-dynamic";

type EditPost = NonNullable<Awaited<ReturnType<typeof getPostForEdit>>>;

function toLocalInput(d: Date | null | undefined): string {
  return d ? new Date(d).toISOString().slice(0, 16) : "";
}
function toDateInput(d: Date | null | undefined): string {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

function mapToInitial(post: EditPost): PostFormInitial {
  const base = emptyInitial(post.type);
  return {
    ...base,
    type: post.type,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    content: post.content,
    categoryId: post.categoryId ?? "",
    tags: post.tags.map((t) => t.tag.name),
    featuredImage: post.featuredImage
      ? { id: post.featuredImage.id, url: post.featuredImage.url }
      : {},
    isFeatured: post.isFeatured,
    status: post.status,
    scheduledAt: toLocalInput(post.scheduledAt),
    references: post.references.map((r) => ({ label: r.label, url: r.url })),
    seo: {
      metaTitle: post.seo?.metaTitle ?? "",
      metaDescription: post.seo?.metaDescription ?? "",
      ogImageUrl: post.seo?.ogImageUrl ?? "",
      keywords: (post.seo?.keywords ?? []).join(", "),
      noindex: post.seo?.noindex ?? false,
    },
    job: post.jobDetail
      ? {
          companyName: post.jobDetail.companyName,
          companyWebsite: post.jobDetail.companyWebsite ?? "",
          state: post.jobDetail.state ?? "",
          city: post.jobDetail.city ?? "",
          jobType: post.jobDetail.jobType,
          salaryMin: post.jobDetail.salaryMin?.toString() ?? "",
          salaryMax: post.jobDetail.salaryMax?.toString() ?? "",
          salaryText: post.jobDetail.salaryText ?? "",
          applyUrl: post.jobDetail.applyUrl,
          experienceLevel: post.jobDetail.experienceLevel ?? "",
          qualifications: post.jobDetail.qualifications ?? "",
          expiryDate: toDateInput(post.jobDetail.expiryDate),
        }
      : base.job,
  };
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, categories, locations] = await Promise.all([
    getPostForEdit(id),
    listCategories(),
    getLocations(),
  ]);
  if (!post || post.deletedAt) notFound();

  return (
    <PostForm
      mode="edit"
      postId={id}
      initial={mapToInitial(post)}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      states={locations.states}
    />
  );
}
