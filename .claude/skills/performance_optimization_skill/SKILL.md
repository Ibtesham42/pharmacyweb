---
name: performance_optimization_skill
description: Diagnose and fix Core Web Vitals / Lighthouse issues — images, fonts, bundle size, ISR/caching. Use when performance regresses or before launch.
---

# Performance Optimization Skill

## When to use
Lighthouse < 95 or CWV not "Good", or before launch.

## Steps
1. Measure: Lighthouse (mobile) + field CWV. Identify LCP/CLS/INP offenders.
2. Images: `next/image`, correct sizes, AVIF/WebP, `priority` only for LCP.
3. Fonts: `next/font` with `display: swap`; subset.
4. JS: reduce `"use client"`; dynamic-import heavy/below-fold (editor, ads, charts).
5. Caching: ISR (`revalidate`) for content; tag-based revalidation on publish.
6. Ads: lazy-load; reserve fixed space to avoid CLS.
7. Re-measure; confirm ≥ 95.

## Checklist
- [ ] LCP optimized; CLS ~0; INP low.
- [ ] Minimal client JS; heavy parts code-split.
- [ ] ISR/caching configured.
- [ ] Lighthouse mobile ≥ 95.
