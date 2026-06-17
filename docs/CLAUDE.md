# CLAUDE.md — `docs/` (Documentation)

Living documentation. Keep these in sync — they are part of "definition of done" for every phase.

## Files

| File | Purpose | Update when |
|---|---|---|
| `SRS.md` | Software Requirements Specification (scope, roles, functional/non-functional reqs). | Requirements change. |
| `ARCHITECTURE.md` | System architecture, layering, data flow, decisions (ADR-style). | Structure/flow/tech changes. |
| `DATABASE.md` | ER model, entity descriptions, indexing & FTS notes. | Schema changes. |
| `ROADMAP.md` | Phases, deliverables, task status. | Start/finish of any phase or task. |
| `PROGRESS.md` | Chronological log: what was done, decisions, follow-ups. | After every work session/phase. |
| `CHANGELOG.md` | User-facing change log (Keep a Changelog format). | Any shipped change. |
| `AI.md` | AI module architecture + roadmap (Groq chat, admin settings, deferred RAG/job-AI). | AI features change. |

## Rules

- ER diagram source of truth is `DATABASE.md` (Mermaid) — regenerate when schema changes.
- Use absolute dates (not "today"/"yesterday").
- Keep entries concise and skimmable.

## Review checklist (end of every phase)

- [ ] ARCHITECTURE/DATABASE reflect reality.
- [ ] ROADMAP statuses updated.
- [ ] PROGRESS + CHANGELOG appended.
- [ ] All CLAUDE.md "Last updated" lines bumped.

---
_Last updated: 2026-06-17 — Marketplace Phase 1 verified + categories seeded; `MARKETPLACE.md` + `AI.md` document the **Phase 2 admin AI authoring tools** (excerpt/SEO/tags/MCQs/flashcards); docs synced._
