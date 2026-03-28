# Remaining Vulnerabilities & Optimization Items

> **Last audit:** March 28, 2026  
> **Status:** All identified items have been resolved. ✅

---

## HIGH Severity

### ~~1. `xlsx` — Prototype Pollution & ReDoS~~ ✅ RESOLVED
- **Fixed:** Replaced `xlsx` with `exceljs` in all three consumers: `import/route.ts`, `versions/[versionId]/route.ts`, and `seed_bank.js`. Package removed from dependencies.

### ~~2. `glob` / `eslint-config-next` — Command Injection (dev-only)~~ ✅ RESOLVED
- **Fixed:** Upgraded to `eslint-config-next@16.2.1` + `eslint@9` as part of Next.js 16 migration.

### ~~3. Next.js 14.2.x — Remaining CVEs requiring Next.js 15+/16~~ ✅ RESOLVED
- **Fixed:** Upgraded to `next@16.2.1`. All Next.js CVEs resolved.

---

## MEDIUM Severity

### ~~4. No rate limiting on auth endpoints~~ ✅ RESOLVED
- **Fixed:** Added in-memory rate limiter (`src/lib/rateLimit.ts`). Applied to `/api/auth/register` (5 req/15min per IP) and `/api/auth/[...nextauth]` POST (10 req/min per IP).

### ~~5. Build config suppresses type errors~~ ✅ RESOLVED
- **Fixed:** Removed `typescript.ignoreBuildErrors` flag from `next.config.mjs`. All type errors resolved — `npx tsc --noEmit` and `npx next build` pass cleanly.

### ~~6. Profile email change without session invalidation~~ ✅ RESOLVED
- **Fixed:** API returns `requireReauth: true` on email change. Profile page signs user out after success message, forcing re-authentication with updated session.

---

## LOW Severity / Optimization

### ~~7. Excessive `console.error` in client-side pages~~ ✅ RESOLVED
- **Fixed:** Removed all `console.error` from client-side pages (10 files). Server-side API route logging retained (appropriate for server logs).

### ~~8. Large bundle: `results/page.tsx`~~ ✅ RESOLVED
- **Fixed:** Extracted Recharts radar chart into `src/components/ResultsRadarChart.tsx` loaded via `next/dynamic` with `ssr: false`. Changed `exportResultsPdf` to dynamic `import()` on button click. Recharts and jsPDF are now code-split and loaded on demand.

### ~~9. Prisma schema migration needed for default role change~~ ✅ RESOLVED
- **Fixed:** Created migration `20260328164728_default_role_user` to set DB column default from `'contentAdmin'` to `'user'`. Run `npx prisma migrate deploy` before deploying.

---

## Previously Fixed (reference)

| # | Issue | Fix Date |
|---|-------|----------|
| ✅ | Error message information leakage (3 API routes) | 2026-03-28 |
| ✅ | `$executeRawUnsafe` / `$queryRawUnsafe` SQL injection surface | 2026-03-28 |
| ✅ | Privilege escalation — contentAdmin could assign admin role | 2026-03-28 |
| ✅ | No password strength validation on registration | 2026-03-28 |
| ✅ | Missing security headers (X-Frame-Options, HSTS, etc.) | 2026-03-28 |
| ✅ | Next.js 16 upgrade (14.2.15 → 16.2.1) — all Next.js CVEs resolved | 2026-03-28 |
| ✅ | ESLint 9 + eslint-config-next@16.2.1 — glob injection resolved | 2026-03-28 |
| ✅ | Async params migration for Next.js 16 compatibility | 2026-03-28 |
| ✅ | next.config.mjs — removed deprecated `experimental.serverComponentsExternalPackages` & `eslint` key | 2026-03-28 |
| ✅ | Unused components (GlassCard, GlassPanel) removed | 2026-03-28 |
| ✅ | Debug variables in feedback route removed | 2026-03-28 |
| ✅ | Azure AD default role changed to `user` | 2026-03-28 |
| ✅ | Registration default role changed to `user` | 2026-03-28 |
| ✅ | `xlsx` replaced with `exceljs` — Prototype Pollution & ReDoS eliminated | 2026-03-28 |
| ✅ | Rate limiting added to auth endpoints (register + login) | 2026-03-28 |
| ✅ | `ignoreBuildErrors` flag removed, all type errors fixed | 2026-03-28 |
| ✅ | Profile email change now forces re-authentication | 2026-03-28 |
| ✅ | Client-side `console.error` removed from 10 pages | 2026-03-28 |
| ✅ | Results page bundle — Recharts + jsPDF lazy-loaded | 2026-03-28 |
| ✅ | Prisma migration for default role `user` created | 2026-03-28 |
