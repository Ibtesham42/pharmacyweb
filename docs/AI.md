# AI Module — Architecture & Roadmap

Groq-powered healthcare assistant for the platform. Built modular and provider-agnostic so future
AI features can be added without refactoring. Follows the repo layering: `app/` → `services/` → `lib/`.

## Status (Phase 2 — foundation shipped)

**Built now:** AI Chat (streaming); **image + document understanding** (vision + OCR via a Groq Llama 4
model; PDF/DOCX/TXT text extraction); the **Career Copilot** (`/copilot`: chat, resume analysis, job
matching, interview prep, study help, learning recommendations); an **admin AI authoring assistant for
marketplace resources** (excerpt / SEO / tags / MCQs / flashcards); Admin AI Settings + usage analytics;
safety guardrails; and 8 knowledge modes. **Designed/deferred:** RAG, AI Article Assistant (Post editor), AI semantic
search, multilingual, voice/STT/TTS, camera medicine scanner, barcode scanner, drug-interaction checker.

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
| Document text extraction | `lib/ai/extract.ts` (unpdf / mammoth) |
| Validation (Zod) | `lib/validation.ts` (`aiChatSchema`, `aiSettingsSchema`) |
| Domain logic | `services/ai/{settings,chat,usage,conversations}.ts` |
| API | `app/api/ai/chat/route.ts` (multimodal streaming), `app/api/ai/extract/route.ts` (doc text), `app/api/ai/conversations/route.ts` |
| Career Copilot | `lib/ai/career.ts`, `services/ai/career.ts`, `app/api/ai/career/*`, `app/(public)/copilot`, `components/public/career-copilot.tsx` |
| Resource authoring tools (admin) | `lib/ai/resource-tools.ts`, `services/ai/resource-tools.ts`, `app/api/admin/resources/ai/route.ts`, `components/admin/resource-ai-tools.tsx` (in `resource-form.tsx`) |
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

`GENERAL`, `PHARMACY_EDU`, `CAREER`, `JOB_SEARCH`, `DRUG_INFO`, `PLANT_ID`, `MEDICAL_DEVICE`, `STUDENT`
— each independently enable/disable-able in Admin → AI Settings; each maps to a focused system prompt
(`lib/ai/safety.ts`).

## Multimodal (image + document understanding)
- **Images** (medicine/plant/device/prescription/lab-report photos): sent as base64 `ImagePart`s to a
  Groq **vision** model (`visionModel`, default Llama 4 Scout) — handles OCR + analysis. The system
  prompt enforces confidence indicators and "verify with an expert / official sources".
- **Documents** (PDF/DOCX/TXT): text extracted server-side at `app/api/ai/extract` via `lib/ai/extract.ts`
  (unpdf / mammoth), returned to the browser, and injected as context on each turn.
- **Ephemeral & private:** nothing is stored — images stay in the browser and are re-sent on follow-ups;
  document text is held client-side. No Cloudinary, no DB rows for uploads. Per-day upload cap +
  per-type size limits + admin toggles (`imageAnalysisEnabled` / `documentAnalysisEnabled`).
- Modes `PLANT_ID` / `MEDICAL_DEVICE` / `STUDENT` tailor the assistant for plant ID, device help, and
  student study aids (summaries / MCQs / flashcards).

## Career Copilot (`/copilot`)
Unified dashboard — tabs **Chat · Resume · Job Match · Interview · Study · Learn** — reusing `AiChat`
(Study uses `defaultMode="STUDENT"` + a separate `storageNamespace`).
- **Structured tools** via the AI SDK `generateObject` (typed Zod schemas in `lib/ai/career.ts`) →
  score bars, match %, skill chips. On failure each tool falls back to a `generateText` markdown answer
  (`ResultPanel`), so it never hard-crashes.
- `services/ai/career.ts`: `analyzeResume`, `matchJobs` (reads live jobs via `listPosts`),
  `interviewQuestions`, `recommendLearning` (reads articles/categories); routes at `app/api/ai/career/*`.
- **Ephemeral & private:** the resume is extracted (reusing `/api/ai/extract`) and held in the browser
  (sessionStorage), reused across tabs — never stored server-side. Usage logged via `AiRequestLog.feature`
  (`RESUME` / `JOB_MATCH` / `INTERVIEW` / `LEARN`). Admin toggle `careerToolsEnabled`.

## Deferred design (build later, no refactor needed)

- **RAG (pgvector on Neon):** `AiKnowledgeFile` table exists for admin uploads. Add an `AiEmbedding`
  table via a raw SQL migration (`CREATE EXTENSION vector` + `vector` column + ivfflat/hnsw index),
  an ingestion job (chunk → embed → store), and a retrieval step that injects top-k context into the
  system prompt. Alternative: Qdrant (rejected — pgvector reuses existing Postgres, zero new infra).
- **Job AI tools:** ✅ shipped in the Career Copilot (resume analysis, job matching, interview prep) — see the Career Copilot section above.
- **AI Article Assistant (admin):** outline/SEO title/meta/tags/summary buttons in
  `components/admin/post-form.tsx` calling a new admin-only AI route (human approval before publish).
  _The marketplace-resource variant of this is now **shipped** — see "Resource authoring tools" in the
  code map (excerpt / SEO / tags / MCQs / flashcards). The `Post` editor version can reuse the same
  `structured<T>` + admin-route pattern._
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
