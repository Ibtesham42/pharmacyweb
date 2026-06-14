-- Full-text search setup (pg_trgm + GIN expression/trigram indexes).
-- Idempotent (IF NOT EXISTS) so it is safe alongside the seed's FTS step.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

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

CREATE INDEX IF NOT EXISTS post_title_trgm_idx
  ON "Post" USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS jobdetail_company_trgm_idx
  ON "JobDetail" USING GIN ("companyName" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS jobdetail_city_trgm_idx
  ON "JobDetail" USING GIN (city gin_trgm_ops);

CREATE INDEX IF NOT EXISTS jobdetail_state_trgm_idx
  ON "JobDetail" USING GIN (state gin_trgm_ops);
