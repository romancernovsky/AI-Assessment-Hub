# Project Guidelines

## Code Style
- Use TypeScript and Next.js App Router patterns already present in `ai-hub-assessment/src/app`.
- Keep UI work aligned with the visual system in `VISUAL_STYLE_SPEC.md` unless a task explicitly asks for a new style direction.
- Reuse existing shared UI components in `ai-hub-assessment/src/components/ui` before adding new primitives.
- Keep API handlers in `ai-hub-assessment/src/app/api` consistent with existing `NextResponse.json(...)` request/response patterns.

## Architecture
- The active app lives in `ai-hub-assessment/`.
- Routing is split by audience:
  - Public: `/login`, `/register`, `/about`, `/feedback`
  - Authenticated users: `/assessment`, `/dashboard`, `/results`, `/review`
  - Admin/content admin: `/admin/*`
- Route protection is enforced in `ai-hub-assessment/src/middleware.ts` using token role checks.
- Auth is NextAuth credentials + JWT session strategy configured in `ai-hub-assessment/src/lib/auth.ts`.
- Data access uses Prisma with PostgreSQL schema in `ai-hub-assessment/prisma/schema.prisma`.

## Build and Test
- From `ai-hub-assessment/`, install and run:
  - `npm install`
  - `npm run dev`
- Validation/build commands:
  - `npm run lint`
  - `npm run build`
- Prisma/common setup commands (run when relevant):
  - `npx prisma generate`
  - `npx prisma migrate dev --name <migration-name>`
  - `node seed_bank.js`
- Local Docker option: `docker compose up --build` from `ai-hub-assessment/`.

## Conventions
- Always configure environment first: copy `ai-hub-assessment/.env.example` to `.env` and set real values for `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`.
- Keep role semantics unchanged unless requested: `admin`, `contentAdmin`.
- Preserve Prisma JSON-backed fields and status values used by assessment flows (`in_progress`, `completed`, `deleted`).
- `seed_bank.js` reads `AI_Hub_Assessment_v2_Question_Bank.xlsx` from the workspace root; keep that path assumption intact when adjusting seed logic.