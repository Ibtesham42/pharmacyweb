---
name: ui_design_skill
description: Build mobile-first, accessible UI with TailwindCSS + shadcn/ui matching the design system. Use when creating components or pages.
---

# UI Design Skill

## When to use
Building or restyling any UI.

## Steps
1. Design mobile-first (360px) then scale up. Use the container + spacing scale.
2. Use shadcn/ui primitives in `components/ui`; compose feature UI in `components/public|admin`.
3. Use design tokens (CSS variables: primary teal, etc.); support light/dark.
4. Accessibility: semantic elements, labels, focus rings, WCAG AA contrast, 44px tap targets.
5. Performance: `next/image`, lazy-load heavy parts, reserve space (no CLS).
6. Reuse shared components (JobCard, ArticleCard, AdSlot, Breadcrumbs, SearchBar, Pagination, EmptyState).

## Checklist
- [ ] Looks right at 360px and desktop.
- [ ] Accessible (labels, focus, contrast).
- [ ] Uses tokens + shared components.
- [ ] No CLS; images optimized.
