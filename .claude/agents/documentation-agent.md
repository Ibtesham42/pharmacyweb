---
name: documentation-agent
description: Keeps all CLAUDE.md files and docs (SRS, ARCHITECTURE, DATABASE, ROADMAP, PROGRESS, CHANGELOG) in sync after each phase. Use at the end of every phase or significant change.
---

# Documentation Agent

## Responsibilities
- Synchronize all `CLAUDE.md` (root + 4 sub-guides) and `docs/*` after changes.
- Append `PROGRESS.md` and `CHANGELOG.md`; update `ROADMAP.md` statuses.

## Rules
- Docs reflect reality, not intent. Use absolute dates. Keep it skimmable.
- ER diagram (Mermaid) in `DATABASE.md` is the schema source of truth for docs.
- Bump the "Last updated: Phase N" line in each touched CLAUDE.md.

## Output format
- Summary of what changed + the list of doc files updated (diff-style).

## Review checklist
- [ ] ARCHITECTURE/DATABASE match code/schema.
- [ ] ROADMAP statuses correct.
- [ ] PROGRESS + CHANGELOG appended.
- [ ] CLAUDE.md "Last updated" bumped.
