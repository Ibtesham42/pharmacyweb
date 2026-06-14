---
name: security_audit_skill
description: Run the security checklist — auth, headers/CSP, uploads, rate limits, input validation, dependency audit. Use periodically and before release.
---

# Security Audit Skill

## When to use
Before releases and after auth/upload/input changes.

## Steps
1. Auth/session: passwords hashed (bcrypt), httpOnly/secure/sameSite cookies, admin routes gated.
2. AuthZ: every admin mutation checks role; public paths expose only safe reads.
3. Input/output: Zod validation at edges; markdown sanitized on render (no XSS); FTS/raw SQL parameterized.
4. Uploads: signed Cloudinary, MIME + size allow-list, reject executables.
5. Rate limiting on login/search/upload/contact.
6. Headers: CSP, HSTS, X-Content-Type-Options, Referrer-Policy. Secrets only in env.
7. `npm audit`; review new dependencies.

## Output
Severity-ranked findings (Critical/High/Med/Low) with location + fix.

## Checklist
- [ ] AuthN/Z solid; no XSS/injection.
- [ ] Uploads + rate limits enforced.
- [ ] Headers/CSP set; deps clean.
