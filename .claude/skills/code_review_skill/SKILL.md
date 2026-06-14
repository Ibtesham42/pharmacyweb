---
name: code_review_skill
description: Review a diff for correctness, security, performance, and convention adherence in this repo. Use before merging.
---

# Code Review Skill

## When to use
Reviewing changes before merge.

## Steps
1. Correctness: logic, edge cases, error handling, types (no stray `any`).
2. Architecture: layering respected (no business logic in components; services framework-free).
3. Security: input validation, authz, no XSS/injection, no secret leakage.
4. Performance: minimal client JS, no N+1 queries, indexed queries, no CLS.
5. SEO: public pages have metadata + JSON-LD + canonical.
6. Conventions: naming, slugs, money-as-minor-units, soft-delete filters, audit logs.
7. Tests updated; `typecheck`, `lint`, `build` pass.

## Output
Findings grouped by severity with file:line and a suggested fix.

## Checklist
- [ ] Correct + typed + tested.
- [ ] Secure + performant.
- [ ] SEO + conventions honored.
- [ ] CI green.
