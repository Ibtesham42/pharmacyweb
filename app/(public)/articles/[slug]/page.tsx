import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublishedPostBySlug, getRelated, getPublishedSlugs } from "@/services/posts";
import { safe } from "@/lib/utils";
import { ArticleDetail } from "@/components/public/article-detail";
import { ViewBeacon } from "@/components/public/view-beacon";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await safe(getPublishedSlugs("ARTICLE"), []);
  return slugs.map((slug) => ({ slug }));
}

const getArticle = cache((slug: string) => getPublishedPostBySlug(slug));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getArticle(slug);
  if (!post || post.type !== "ARTICLE") return { title: "Article not found" };
  return buildMetadata({
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.excerpt || undefined,
    path: `/articles/${post.slug}`,
    image: post.seo?.ogImageUrl || post.featuredImage?.url,
    type: "article",
    noindex: post.seo?.noindex,
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    keywords: post.seo?.keywords,
  });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getArticle(slug);
  if (!post || post.type !== "ARTICLE") notFound();

  const related = await getRelated(post, 4);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Articles", path: "/articles" },
    { name: post.title, path: `/articles/${post.slug}` },
  ];

  return (
    <>
      <ViewBeacon postId={post.id} />
      <JsonLd
        data={[
          articleJsonLd({
            title: post.title,
            description: post.excerpt || post.title,
            slug: post.slug,
            section: "articles",
            image: post.featuredImage?.url,
            publishedAt: post.publishedAt,
            modifiedAt: post.updatedAt,
            authorName: post.author.name,
          }),
          breadcrumbJsonLd(crumbs),
        ]}
      />
      <ArticleDetail post={post} section="articles" related={related} crumbs={crumbs} />
    </>
  );
}
