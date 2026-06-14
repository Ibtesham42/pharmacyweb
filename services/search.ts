import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { postCardInclude, type PostCard } from "@/services/posts";
import type { SearchInput } from "@/lib/validation";

const PER_PAGE = 12;

/**
 * Full-text + fuzzy search across posts. Matches FTS on title/excerpt/content,
 * trigram-similar titles, and job company/city/state. Filters by type, location,
 * category and job type. Ranked by ts_rank + title similarity.
 */
export async function searchPosts(params: SearchInput): Promise<{
  items: PostCard[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}> {
  const { q, type, state, city, category, jobType, page } = params;
  const perPage = PER_PAGE;
  const offset = (page - 1) * perPage;

  const conditions: Prisma.Sql[] = [
    Prisma.sql`p."deletedAt" IS NULL`,
    Prisma.sql`(p.status = 'PUBLISHED' OR (p.status = 'SCHEDULED' AND p."scheduledAt" <= NOW()))`,
  ];
  if (type) conditions.push(Prisma.sql`p.type = ${type}::"PostType"`);
  if (category) conditions.push(Prisma.sql`c.slug = ${category}`);
  if (state) conditions.push(Prisma.sql`j.state = ${state}`);
  if (city) conditions.push(Prisma.sql`j.city = ${city}`);
  if (jobType) conditions.push(Prisma.sql`j."jobType" = ${jobType}::"JobType"`);

  const ftsExpr = Prisma.sql`to_tsvector('english', coalesce(p.title,'') || ' ' || coalesce(p.excerpt,'') || ' ' || coalesce(p.content,''))`;
  let rankExpr: Prisma.Sql = Prisma.sql`0`;

  if (q && q.trim().length > 0) {
    const term = q.trim();
    const like = `%${term}%`;
    const tsq = Prisma.sql`websearch_to_tsquery('english', ${term})`;
    conditions.push(
      Prisma.sql`(${ftsExpr} @@ ${tsq} OR p.title % ${term} OR j."companyName" ILIKE ${like} OR j.city ILIKE ${like} OR j.state ILIKE ${like})`,
    );
    rankExpr = Prisma.sql`(ts_rank(${ftsExpr}, ${tsq}) + similarity(p.title, ${term}))`;
  }

  const whereSql = Prisma.join(conditions, " AND ");
  const joins = Prisma.sql`
    FROM "Post" p
    LEFT JOIN "Category" c ON c.id = p."categoryId"
    LEFT JOIN "JobDetail" j ON j."postId" = p.id
  `;

  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT p.id, ${rankExpr} AS rank
      ${joins}
      WHERE ${whereSql}
      ORDER BY rank DESC, p."publishedAt" DESC NULLS LAST
      LIMIT ${perPage} OFFSET ${offset}
    `),
    prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
      SELECT COUNT(DISTINCT p.id)::bigint AS count ${joins} WHERE ${whereSql}
    `),
  ]);

  const ids = rows.map((r) => r.id);
  const total = Number(countRows[0]?.count ?? 0);
  if (ids.length === 0) {
    return { items: [], total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
  }

  const posts = await prisma.post.findMany({ where: { id: { in: ids } }, include: postCardInclude });
  const byId = new Map(posts.map((p) => [p.id, p]));
  const items = ids.map((id) => byId.get(id)).filter((p): p is PostCard => Boolean(p));

  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}
