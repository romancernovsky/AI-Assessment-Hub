# SSO Implementation Plan — Azure Active Directory

> **Status:** In Progress  
> **Created:** 2026-03-28  
> **App:** AI Hub Assessment (Next.js 14 + NextAuth 4 + Prisma + PostgreSQL)

---

## Overview

Enable Single Sign-On (SSO) via Azure Active Directory (Azure AD / Entra ID) using the OAuth 2.0 / OpenID Connect protocol. Admin users retain the existing credentials-based login. SSO users get an automatic profile in the database on first login.

---

## Azure AD Configuration Reference

| Field | Value |
|---|---|
| Domain | `novartis.net` |
| Azure App Name | secopsai dev devops |
| Protocol | OAuth 2.0 (OpenID Connect) |
| Application (client) ID | `cd6b814b-614a-408f-9ada-9e7b84ec5ff8` |
| Object ID | `51ca2dc3-9531-40d4-a84b-14439c087030` |
| Reply URL (Redirect URI) | `https://portal.azure1/SECOPSAI` (production) — dev: `http://localhost:3000/api/auth/callback/azure-ad` |
| Directory (tenant) ID | `f35a6974-607f-47d4-82d7-ff31d7dc53a5` |
| Group | `AAD_DYN_NVS_521_1` |

> **Important:** You must also register the NextAuth callback URL as a Redirect URI in the Azure App Registration:  
> `http://localhost:3000/api/auth/callback/azure-ad` (dev)  
> `https://<your-production-domain>/api/auth/callback/azure-ad` (prod)

---

## Todo Checklist

Use this to track progress. Mark items `[x]` as completed.

### Phase 1: Environment & Dependencies

- [x] 1.1 — Install `next-auth` Azure AD provider package (`next-auth` v4 has built-in `AzureADProvider`)
- [x] 1.2 — Add Azure AD environment variables to `.env` and `.env.example`
  - `AZURE_AD_CLIENT_ID`
  - `AZURE_AD_CLIENT_SECRET`
  - `AZURE_AD_TENANT_ID`

### Phase 2: Database Schema

- [x] 2.1 — Update `prisma/schema.prisma` — make `password` optional (SSO users don't have passwords)
- [x] 2.2 — Add `authProvider` field to `User` model (`"credentials"` | `"azure-ad"`)
- [x] 2.3 — Run `npx prisma migrate dev --name add_sso_fields`

### Phase 3: Auth Configuration

- [x] 3.1 — Add `AzureADProvider` to `src/lib/auth.ts` alongside existing `CredentialsProvider`
- [x] 3.2 — Implement `signIn` callback — auto-create user in DB on first SSO login
- [x] 3.3 — Update `jwt` and `session` callbacks to handle both SSO and credentials users
- [x] 3.4 — Update NextAuth type declarations in `src/types/next-auth.d.ts`

### Phase 4: Login UI

- [x] 4.1 — Update `src/app/login/page.tsx` — add "Sign in with Novartis SSO" button
- [x] 4.2 — Add visual separator between SSO and credentials login
- [x] 4.3 — Credentials form should indicate it's for admin users only

### Phase 5: Middleware & Route Protection

- [x] 5.1 — Verify `src/middleware.ts` works with both auth flows (it uses JWT — should work)
- [x] 5.2 — Ensure SSO callback route `/api/auth/callback/azure-ad` is not blocked

### Phase 6: Admin Seed User

- [x] 6.1 — Create seed script for admin user (`admin@admin.com` / `password`)
- [x] 6.2 — Admin user gets `role: "admin"` and `authProvider: "credentials"`

### Phase 7: Testing & Validation

- [ ] 7.1 — `npm run build` compiles without errors
- [ ] 7.2 — Test credentials login with seeded admin user
- [ ] 7.3 — Test SSO login flow redirects to Microsoft login
- [ ] 7.4 — Verify first-time SSO user gets profile created in DB
- [ ] 7.5 — Verify SSO user can access protected routes
- [ ] 7.6 — Verify admin routes are still restricted to `admin`/`contentAdmin` roles

---

## Files Modified / Created

| File | Action | Purpose |
|---|---|---|
| `.env.example` | Modified | Add Azure AD env vars |
| `prisma/schema.prisma` | Modified | Optional password, add `authProvider` field |
| `prisma/migrations/xxx_add_sso_fields/` | Created | Migration for schema changes |
| `src/lib/auth.ts` | Modified | Add AzureADProvider, signIn callback, auto-create user |
| `src/types/next-auth.d.ts` | Modified | Add `authProvider` to session types |
| `src/app/login/page.tsx` | Modified | Add SSO button + admin credentials section |
| `src/middleware.ts` | Unchanged | Already JWT-based, works for both flows |
| `seed_admin.js` | Created | Seed admin user with credentials |

---

## Architecture Notes

### Auth Flow — SSO (Azure AD)

```
User clicks "Sign in with SSO"
  → NextAuth redirects to Microsoft login (tenant-specific)
  → User authenticates with Novartis AD credentials
  → Microsoft redirects back to /api/auth/callback/azure-ad
  → NextAuth signIn callback fires
    → Check if user exists in DB by email
    → If not: create User with authProvider="azure-ad", password=""
    → If yes: update lastLoginAt
  → JWT issued with user role, id
  → User redirected to /dashboard
```

### Auth Flow — Credentials (Admin)

```
Admin enters email + password on /login
  → NextAuth CredentialsProvider.authorize() runs
  → Checks DB for user with matching email
  → Verifies bcrypt password hash
  → Returns user with role
  → JWT issued
  → Admin redirected to /dashboard
```

### Key Design Decisions

1. **SSO users get `role: "contentAdmin"` by default** — admins are only created via seed/manual DB
2. **Password field is optional** — SSO users have no password; field stores empty string
3. **`authProvider` field** tracks how the user registered (`"credentials"` or `"azure-ad"`)
4. **No self-registration for SSO users** — account is auto-created on first SSO login
5. **Existing `/register` route stays** — for manual credential-based account creation

---

## Environment Variables Required

```env
# Existing
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# New — Azure AD SSO
AZURE_AD_CLIENT_ID="cd6b814b-614a-408f-9ada-9e7b84ec5ff8"
AZURE_AD_CLIENT_SECRET="<obtain from Azure App Registration → Certificates & secrets>"
AZURE_AD_TENANT_ID="f35a6974-607f-47d4-82d7-ff31d7dc53a5"
```

> **Note:** `AZURE_AD_CLIENT_SECRET` must be generated in the Azure Portal under  
> App Registration → Certificates & secrets → New client secret

---

## Resuming Development

If development is interrupted, use this guide to pick up where you left off:

1. Check the **Todo Checklist** above — find the first unchecked `[ ]` item
2. Ensure `.env` has all required variables (see Environment Variables section)
3. Run `npx prisma migrate dev` to apply any pending migrations
4. Run `npx prisma generate` to regenerate the Prisma client
5. Run `node seed_admin.js` from `ai-hub-assessment/` to ensure admin user exists
6. Run `npm run dev` to start the dev server
7. Test both login flows:
   - Credentials: `admin@admin.com` / `password`
   - SSO: Click "Sign in with Novartis SSO" button

---

## Rollback Plan

If SSO needs to be reverted:

1. Remove `AzureADProvider` from `src/lib/auth.ts`
2. Remove SSO button from `src/app/login/page.tsx`
3. Remove Azure AD env vars from `.env`
4. Optionally revert prisma schema (make password required again) — but this would break SSO user records
5. The `authProvider` field and optional password are backward-compatible and can stay

---
