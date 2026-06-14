---
name: create_post_skill
description: Guided creation of a Job, Medical News, or Blog Article post including SEO metadata, slug, tags, category, and media. Use when adding new content.
---

# Create Post Skill

## When to use
Creating or drafting any content item (Job / News / Article).

## Steps
1. Pick `type` (JOB | NEWS | ARTICLE). Gather required fields:
   - All: title, excerpt, content (markdown), category, tags, featured image, status.
   - Job adds: company, city/state, jobType, salary, applyUrl, expiryDate.
   - News/Article add: references (label + url).
2. Generate a unique slug from the title (`slugify`); ensure uniqueness.
3. Fill SEO panel: metaTitle (≤60), metaDescription (≤155), OG image, keywords. Default from title/excerpt if blank.
4. Validate with the Zod schema in `lib/validation`.
5. Save via the post Server Action; set `status` (DRAFT/SCHEDULED/PUBLISHED) and `scheduledAt`/`publishedAt`.
6. On publish, revalidate affected paths/tags.

## Checklist
- [ ] Required fields per type present.
- [ ] Unique slug; SEO fields set.
- [ ] Featured image has alt text.
- [ ] Validation passes; audit log written.
