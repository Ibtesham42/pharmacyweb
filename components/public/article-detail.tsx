import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock, User } from "lucide-react";
import type { PostDetail, PostCard as PostCardData } from "@/services/posts";
import { Markdown } from "@/components/markdown";
import { Breadcrumbs, type Crumb } from "@/components/public/breadcrumbs";
import { ShareButtons } from "@/components/public/share-buttons";
import { PostSaveButton } from "@/components/public/post-save-button";
import { PostCard } from "@/components/public/post-card";
import { AdSlot } from "@/components/ads/ad-slot";
import { Badge } from "@/components/ui/badge";
import { formatDate, readingTime } from "@/lib/format";

export function ArticleDetail({
  post,
  section,
  related,
  crumbs,
}: {
  post: PostDetail;
  section: "articles" | "news";
  related: PostCardData[];
  crumbs: Crumb[];
}) {
  const path = `/${section}/${post.slug}`;

  return (
    <div className="container max-w-3xl py-8">
      <Breadcrumbs items={crumbs} />

      <article className="mt-4">
        <header>
          {post.category && (
            <Link href={`/categories/${post.category.slug}`}>
              <Badge variant="accent">{post.category.name}</Badge>
            </Link>
          )}
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          {post.excerpt && <p className="mt-3 text-lg text-muted-foreground">{post.excerpt}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" /> {post.author.name}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> {formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {readingTime(post.content)} min read
            </span>
          </div>
        </header>

        {post.featuredImage && (
          <div className="relative my-6 aspect-[16/9] overflow-hidden rounded-xl bg-muted">
            <Image
              src={post.featuredImage.url}
              alt={post.featuredImage.alt || post.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}

        <AdSlot slot="IN_CONTENT" />

        <Markdown content={post.content} className="mt-6" />

        {post.references.length > 0 && (
          <section className="mt-8 rounded-lg border bg-muted/30 p-4">
            <h2 className="mb-2 text-sm font-semibold">References</h2>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {post.references.map((r) => (
                <li key={r.id}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {r.label}
                  </a>
                </li>
              ))}
            </ol>
          </section>
        )}

        {post.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map(({ tag }) => (
              <Link key={tag.id} href={`/search?q=${encodeURIComponent(tag.name)}`}>
                <Badge variant="outline">#{tag.name}</Badge>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
          <ShareButtons path={path} title={post.title} />
          <PostSaveButton slug={post.slug} path={path} size="sm" />
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">Related</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
