-- Full-text search setup for Pharmacy Portal.
-- Idempotent: safe to run repeatedly (executed by prisma/seed.ts after migrate).
-- Provides:
--   * pg_trgm extension for fuzzy / typo-tolerant matching
--   * a GIN expression index on Post (title + excerpt + content) for FTS
--   * trigram indexes on JobDetail company/city/state for location/company search
--   * a trigram index on Post.title for fuzzy title matching

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Weighted full-text expression index over Post content.
CREATE INDEX IF NOT EXISTS post_fts_idx
  ON "Post"
  USING GIN (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' ||
      coalesce(excerpt, '') || ' ' ||
      coalesce(content, '')
    )
  );

-- Fuzzy matching support.
CREATE INDEX IF NOT EXISTS post_title_trgm_idx
  ON "Post" USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS jobdetail_company_trgm_idx
  ON "JobDetail" USING GIN ("companyName" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS jobdetail_city_trgm_idx
  ON "JobDetail" USING GIN (city gin_trgm_ops);

CREATE INDEX IF NOT EXISTS jobdetail_state_trgm_idx
  ON "JobDetail" USING GIN (state gin_trgm_ops);
