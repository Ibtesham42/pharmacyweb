import Link from "next/link";
import Image from "next/image";
import { MapPin, Building2, Calendar, ArrowRight } from "lucide-react";
import type { PostCard as PostCardType } from "@/services/posts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  postPath,
  formatRelative,
  formatSalary,
  jobLocation,
  JOB_TYPE_LABELS,
} from "@/lib/format";

export function PostCard({ post }: { post: PostCardType }) {
  const href = postPath(post.type, post.slug);
  const isJob = post.type === "JOB";

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      {post.featuredImage ? (
        <Link href={href} className="relative block aspect-[16/9] overflow-hidden bg-muted">
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.alt || post.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
      ) : (
        isJob && (
          <Link
            href={href}
            aria-label={post.title}
            className="flex aspect-[16/9] items-center justify-center bg-accent text-accent-foreground"
          >
            <span className="text-4xl font-bold uppercase">
              {post.jobDetail?.companyName?.[0] ?? "J"}
            </span>
          </Link>
        )
      )}

      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {post.category && (
            <Badge variant="accent" className="font-normal">
              {post.category.name}
            </Badge>
          )}
          {isJob && post.jobDetail && (
            <Badge variant="secondary" className="font-normal">
              {JOB_TYPE_LABELS[post.jobDetail.jobType]}
            </Badge>
          )}
        </div>

        <h3 className="line-clamp-2 font-semibold leading-snug">
          <Link href={href} className="hover:text-primary">
            {post.title}
          </Link>
        </h3>

        {isJob && post.jobDetail ? (
          <div className="mt-1 space-y-1 text-sm text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 shrink-0" /> {post.jobDetail.companyName}
            </p>
            <p className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0" />{" "}
              {jobLocation(post.jobDetail.city, post.jobDetail.state)}
            </p>
            {formatSalary(post.jobDetail.salaryMin, post.jobDetail.salaryMax, post.jobDetail.salaryText) && (
              <p className="font-medium text-foreground">
                {formatSalary(post.jobDetail.salaryMin, post.jobDetail.salaryMax, post.jobDetail.salaryText)}
              </p>
            )}
          </div>
        ) : (
          post.excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" /> {formatRelative(post.publishedAt)}
          </span>
          <Link
            href={href}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            aria-label={`View details: ${post.title}`}
          >
            View details <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
