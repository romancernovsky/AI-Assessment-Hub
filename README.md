# AI Assessment Hub

A full-stack AI literacy assessment platform built with **Next.js**, **Prisma**, and **PostgreSQL**. It delivers multi-level assessments with timed sessions, automatic scoring, analytics dashboards, and PDF report export.

## Features

- **Multi-level assessments** — structured question banks across AI competency levels
- **Timed sessions** — configurable per-assessment timers
- **Automatic scoring & results** — instant feedback with radar-chart visualisation
- **Admin dashboard** — user management, question bank editing, analytics, and feedback review
- **PDF export** — downloadable result reports
- **Authentication** — credential-based auth via NextAuth.js (SSO-ready)
- **Dark / light theme** — toggle with persistent preference

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js |
| Charts | Recharts |
| PDF | jsPDF + jspdf-autotable |
| Animations | Framer Motion |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

```bash
cd AIassessment/ai-hub-assessment
cp .env.example .env   # then fill in DATABASE_URL and NEXTAUTH_SECRET
npm install
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
AIassessment/
  ai-hub-assessment/       # Next.js application
    prisma/                 # Database schema & migrations
    src/
      app/                  # App Router pages & API routes
      components/           # Reusable UI components
      lib/                  # Auth, Prisma client, utilities
      providers/            # Theme & auth context providers
```

## License

This project is proprietary. All rights reserved.
