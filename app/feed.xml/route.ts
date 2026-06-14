import { prisma } from "@/lib/prisma";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { postPath } from "@/lib/format";

export const revalidate = 1800;

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] as string,
  );
}

export async function GET() {
  const posts = await prisma.post
    .findMany({
      where: { deletedAt: null, status: "PUBLISHED" },
      select: { title: true, slug: true, type: true, excerpt: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 50,
    })
    .catch(() => []);

  const items = posts
    .map((p) => {
      const url = absoluteUrl(postPath(p.type, p.slug));
      return `<item>
  <title>${escapeXml(p.title)}</title>
  <link>${url}</link>
  <guid isPermaLink="true">${url}</guid>
  <description>${escapeXml(p.excerpt || "")}</description>
  <pubDate>${(p.publishedAt ?? new Date()).toUTCString()}</pubDate>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(siteConfig.name)}</title>
  <link>${siteConfig.url}</link>
  <description>${escapeXml(siteConfig.description)}</description>
  <language>en-IN</language>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
