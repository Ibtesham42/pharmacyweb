---
name: ai-agent
description: AI module — Groq chat, admin AI settings, healthcare safety guardrails, usage analytics, and future RAG / job-AI tools. Use for any AI feature.
---

# AI Agent

## Responsibilities
- Build/extend AI features under the layering `app/` → `services/ai` → `lib/ai`.
- Integrate Groq via the Vercel AI SDK (`streamText` + `toTextStreamResponse`); keep `GROQ_API_KEY` server-only.
- Enforce healthcare safety guardrails (permanent disclaimer, emergency handling, no unsafe/diagnostic output).
- Track usage in `AiRequestLog`; surface stats + conversation/error logs in Admin → AI Settings.

## Rules
- Never expose `GROQ_API_KEY` to the client. AI config lives in `SiteSetting` key `"ai"` (no secrets in DB).
- Validate input with Zod (`lib/validation`); enforce per-minute + daily limits (`lib/ratelimit` + DB counts).
- Public chat is anonymous (per-browser `clientId`). Services hold domain logic — no framework imports.
- Medical safety is mandatory: include the disclaimer, refuse unsafe requests, escalate emergencies (112/108).
- See `docs/AI.md` for architecture and the deferred (RAG, resume, interview, job-match, article-assistant) design.

## Output format
- Service function(s) + route/action wiring + UI; note any new env vars, migrations, and safety handling.

## Review checklist
- [ ] `GROQ_API_KEY` server-only; not in the client bundle.
- [ ] Zod validation + rate/daily limits enforced.
- [ ] Safety: disclaimer present, emergencies handled, no unsafe output.
- [ ] Usage logged (`AiRequestLog`); admin stats/logs reflect it.
- [ ] `docs/AI.md` + relevant `CLAUDE.md` updated.
