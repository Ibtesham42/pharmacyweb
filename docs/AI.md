# AI Module — Architecture & Roadmap

Groq-powered healthcare assistant for the platform. Built modular and provider-agnostic so future
AI features can be added without refactoring. Follows the repo layering: `app/` → `services/` → `lib/`.

## Status (Phase 2 — foundation shipped)

**Built now:** Basic AI Chat (streaming) + Admin AI Settings + usage analytics + safety guardrails +
knowledge modes. **Designed/deferred:** RAG, Resume Analyzer, Interview Prep, Job Match, AI Article
Assistant, AI semantic search, multilingual, voice/STT/TTS, and other future modules.

## Stack & decisions

- **Provider:** Groq via the **Vercel AI SDK** (`ai` + `@ai-sdk/groq`). Server uses `streamText(...)
  .toTextStreamResponse()`; the client reads the text stream directly (no dependence on the SDK's
  `useChat`/UIMessage surface).
- **Models:** default `llama-3.3-70b-versatile`, fast `llama-3.1-8b-instant` (admin-selectable, see
  `lib/ai/config.ts → AI_MODELS`).
- **Secret:** `GROQ_API_KEY` in env only (server-side). Never stored in the DB, never sent to the client.
- **Identity:** no public user auth → chat is anonymous, keyed by a per-browser `clientId`
  (localStorage). Conversations/usage are stored against that id.
- **Config storage:** `SiteSetting` JSON under key `"ai"` (see `services/ai/settings.ts`,
  `lib/ai/config.ts → AiSettings`). No dedicated settings table.

## Code map

| Concern | Files |
|---|---|
| Config + types + disclaimer + prompts list | `lib/ai/config.ts` |
| Safety (system prompts, emergency detection, disclaimer) | `lib/ai/safety.ts` |
| Groq provider (server-only) | `lib/ai/groq.ts` |
| Validation (Zod) | `lib/validation.ts` (`aiChatSchema`, `aiSettingsSchema`) |
| Domain logic | `services/ai/{settings,chat,usage,conversations}.ts` |
| API | `app/api/ai/chat/route.ts` (streaming), `app/api/ai/conversations/route.ts` |
| Admin UI | `app/admin/(panel)/ai/{page,actions}.tsx`, `components/admin/ai-settings-form.tsx` |
| Public UI | `app/(public)/ai/page.tsx`, `components/public/{ai-chat,ai-chat-fab,ai-disclaimer}.tsx` |
| DB | `prisma/schema.prisma` — `AiConversation`, `AiMessage`, `AiRequestLog`, `AiKnowledgeFile` + enums |

## Request flow (chat)

1. Client (`ai-chat.tsx`) POSTs `{ clientId, mode, conversationId?, messages, language? }` to `/api/ai/chat`.
2. Route validates (Zod) → checks `enabled` / `maintenanceMode` / mode enabled / key configured.
3. Limits: per-IP/minute (`lib/ratelimit`) + per-user/day + global/day (`AiRequestLog` counts).
4. Safety: `detectEmergency()` short-circuits with a fixed safe notice (logged `BLOCKED`, no model call).
5. Otherwise `streamText({ model: groq(model), system: buildSystemPrompt(mode), messages, … })` →
   `toTextStreamResponse()`. `onFinish` persists the assistant message + writes an `AiRequestLog`
   (tokens, latency, status). `X-Conversation-Id` header returns the thread id.

## Safety guardrails (medical)

- Permanent disclaimer (`MEDICAL_DISCLAIMER`) shown in all AI UIs; system prompt forbids diagnosis/
  prescription/unsafe instructions and requires recommending a professional.
- Emergency keyword detection returns an immediate "seek emergency care (112/108)" notice.
- Drug-info mode is educational only (no personalised dosing).

## Knowledge modes

`GENERAL`, `PHARMACY_EDU`, `CAREER`, `JOB_SEARCH`, `DRUG_INFO` — each independently enable/disable-able
in Admin → AI Settings; each maps to a focused system prompt (`lib/ai/safety.ts`).

## Deferred design (build later, no refactor needed)

- **RAG (pgvector on Neon):** `AiKnowledgeFile` table exists for admin uploads. Add an `AiEmbedding`
  table via a raw SQL migration (`CREATE EXTENSION vector` + `vector` column + ivfflat/hnsw index),
  an ingestion job (chunk → embed → store), and a retrieval step that injects top-k context into the
  system prompt. Alternative: Qdrant (rejected — pgvector reuses existing Postgres, zero new infra).
- **Job AI tools:** Resume Analyzer, Interview Prep, Job Match — add `services/ai/*` functions +
  `app/api/ai/*` routes + feature flags in `AiSettings`. Reuse `streamText`/`generateText`.
- **AI Article Assistant (admin):** outline/SEO title/meta/tags/summary buttons in
  `components/admin/post-form.tsx` calling a new admin-only AI route (human approval before publish).
- **AI semantic search:** embed posts; vector search alongside the existing Postgres FTS.
- **Multilingual:** `language` param already plumbed (`en`/`hi`/`hinglish`); extend `buildSystemPrompt`.
- **Future:** voice chat, STT/TTS, news summaries, job recommendations, learning assistant, quiz
  generator, PDF Q&A — each is an additive `services/ai/*` + route + UI.

## Operations

- Set `GROQ_API_KEY` in local `.env` and in Vercel (then redeploy). Enable in Admin → AI Settings.
- In-memory rate limiter is per-instance; for strict global limits in production, back limits with the
  DB counts (already used for daily) or add Upstash Redis.
- Admin "AI Settings" shows totals, today's requests, active users, token usage, errors, avg latency,
  plus conversation and error logs. (Per-AdSense-style note: our counters come from `AiRequestLog`.)
