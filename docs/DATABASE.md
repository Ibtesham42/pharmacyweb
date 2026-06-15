# Database Design — Pharmacy Job Portal

_Last updated: 2026-06-15 (AI module tables added)._ Source of truth for the ER model. Implemented in `prisma/schema.prisma`.

## Design notes
- Content uses a single **`Post`** table with a `type` discriminator (JOB | NEWS | ARTICLE) + a 1:1 **`JobDetail`** extension for job-only fields. Shared: tags, category, SEO, media, full-text search.
- Commerce (future) uses a generic **`Product`** (COURSE | PDF) + `Order`/`OrderItem`/`Payment`.
- Money as integer minor units (`*Cents`/paise) + `currency` (default `INR`).
- Soft delete via `Post.deletedAt`; public reads filter `deletedAt = null AND status = PUBLISHED`.
- Full-text search: raw-SQL migration adds a generated `tsvector` column + GIN index on `Post`, and enables `pg_trgm` for fuzzy matching.
- **AI module** (migration `add_ai_module`): `AiConversation` 1:N `AiMessage` (anonymous, keyed by `clientId`), `AiRequestLog` (per-request usage analytics + error logs), `AiKnowledgeFile` (RAG source uploads). AI config lives in `SiteSetting` key `"ai"` (no secrets). Embeddings (pgvector `AiEmbedding`) are deferred — see `docs/AI.md`. Migration `3_ai_multimodal_modes` adds `AiMode` values `PLANT_ID` / `MEDICAL_DEVICE` / `STUDENT` (multimodal uploads are processed ephemerally — no extra tables).

## ER diagram
```mermaid
erDiagram
  User ||--o{ Post : authors
  User ||--o{ Media : uploads
  User ||--o{ AuditLog : performs
  Category ||--o{ Post : categorizes
  Category ||--o{ Category : parent_of
  Post ||--o| JobDetail : has
  Post ||--o| SeoMeta : has
  Post ||--o{ Reference : cites
  Post ||--o{ PostTag : tagged
  Tag ||--o{ PostTag : tags
  Post }o--|| Media : featuredImage
  Post ||--o{ PostMedia : gallery
  Media ||--o{ PostMedia : in
  Product ||--o{ OrderItem : sold_as
  Order ||--o{ OrderItem : contains
  Order ||--o{ Payment : paid_by
  Post ||--o{ AnalyticsEvent : measured
  Advertisement ||--o{ AnalyticsEvent : measured

  User { string id PK; string email UK; string passwordHash; string name; enum role; datetime createdAt }
  Post { string id PK; enum type; string title; string slug UK; string excerpt; text content; enum status; bool isFeatured; int viewCount; datetime publishedAt; datetime scheduledAt; datetime deletedAt; string authorId FK; string categoryId FK; string featuredImageId FK }
  JobDetail { string id PK; string postId UK; string companyName; string companyWebsite; string city; string state; enum jobType; int salaryMin; int salaryMax; string applyUrl; datetime expiryDate }
  Category { string id PK; string name; string slug UK; string parentId FK }
  Tag { string id PK; string name; string slug UK }
  PostTag { string postId FK; string tagId FK }
  Reference { string id PK; string postId FK; string label; string url }
  Media { string id PK; enum type; string url; string publicId UK; string mimeType; int size; string alt; string uploadedById FK }
  PostMedia { string postId FK; string mediaId FK; int position }
  SeoMeta { string id PK; string postId UK; string metaTitle; string metaDescription; string canonicalUrl; string ogImageUrl }
  Advertisement { string id PK; string name; enum slot; enum type; string adsenseSlotId; bool isActive; int impressions; int clicks }
  Product { string id PK; enum type; string name; string slug UK; int priceCents; string currency; enum status }
  Order { string id PK; string orderNumber UK; string customerEmail; enum status; int totalCents }
  OrderItem { string id PK; string orderId FK; string productId FK; int priceCents; int quantity }
  Payment { string id PK; string orderId FK; enum provider; string providerPaymentId; int amountCents; string status }
  AnalyticsEvent { string id PK; enum type; string path; string postId FK; string adId FK; string query; datetime createdAt }
  AuditLog { string id PK; string actorId FK; string action; string entityType; string entityId; datetime createdAt }
  SiteSetting { string id PK; string key UK; json value }
  ContactMessage { string id PK; string name; string email; string message; bool handled }
  Subscriber { string id PK; string email UK; string status }
```

## Key indexes
- `Post`: `(type, status, publishedAt)`, `(categoryId)`, unique `slug`, FTS GIN on `search_vector`.
- `JobDetail`: `(state, city)`, `(jobType)`, `(expiryDate)`.
- `Advertisement`: `(slot, isActive)`. `AnalyticsEvent`: `(type, createdAt)`, `(postId)`.

## Entities (summary)
Users, Posts (+ JobDetail), Categories, Tags (PostTag), Media (PostMedia), SeoMeta, References, Advertisements, Products, Orders/OrderItems, Payments, AnalyticsEvents, AuditLogs, SiteSettings, ContactMessages, Subscribers. Covers every entity required by the spec.
