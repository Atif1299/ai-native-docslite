<div align="center">

<img src="docs/assets/readme-banner.png" width="100%" alt="DocsLite — Create · Edit · Share" />

<br />

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TipTap](https://img.shields.io/badge/TipTap-Editor-A78BFA?style=for-the-badge)](https://tiptap.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

<br />

**AI-native collaborative document editor — create, rich-edit, import, share, and persist in one product-minded MVP.**

<br />

[Live demo](https://app-blush-seven-53.vercel.app) · [Quick start](#quick-start) · [What ships](#what-ships) · [Architecture](#architecture) · [AI workflow](#ai-native-workflow) · [Demo accounts](#demo-accounts)

</div>

---

## What is DocsLite?

**DocsLite** is a lightweight collaborative document editor: seeded login, TipTap rich text, `.txt`/`.md` import, owner/editor/viewer sharing, and durable persistence on Supabase — deployed for click-through review on Vercel.

Built as an **AI-native engineering exercise**: deliberate scope, full-stack execution, and verification under a real timebox (not a Google Docs clone). Reviewers can exercise create → edit → share → reopen without setup beyond the demo accounts below.

## What ships

- Create, rename, TipTap rich text (bold / italic / underline / H1–H3 / lists)
- Autosave + manual save; reopen after refresh
- Import `.txt` / `.md` (max 1MB) → new editable document
- Owner / editor / viewer sharing with Owned vs Shared lists
- In-app confirm dialogs (no browser `confirm` chrome)
- Supabase Postgres persistence + Vercel deploy
- Vitest suite + production E2E smoke script

### Intentionally deprioritized

Realtime cursors, comments, version history, DOCX/PDF, OAuth signup.

## Live demo

**URL:** [https://app-blush-seven-53.vercel.app](https://app-blush-seven-53.vercel.app)

Use the seeded accounts below for a full owner → collaborator share pass.

## Demo accounts

| User | Email | Password | Role |
|------|-------|----------|------|
| Alice | `alice@ajaia.demo` | `password123` | Owner |
| Bob | `bob@ajaia.demo` | `password123` | Collaborator |

Try: sign in as Alice → create/edit → Share with Bob → sign out → sign in as Bob → open **Shared with you**.

## Quick start

```bash
git clone https://github.com/Atif1299/ai-native-docslite.git
cd ai-native-docslite
npm install
cp .env.example .env
# fill AUTH_SECRET + SUPABASE_URL + SUPABASE_ANON_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run build` / `npm start` | Production |
| `npm test` | Vitest (import + access control) |
| `npm run test:e2e` | Live production API smoke |

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for priorities and tradeoffs.

```
Browser (React / TipTap)
  → Next.js App Router + Route Handlers
  → Cookie sessions (jose) + bcryptjs
  → Supabase Postgres (User · Document · DocumentShare)
```

## AI-native workflow

See [`docs/AI_WORKFLOW.md`](docs/AI_WORKFLOW.md) for tools used, what AI sped up, what was rejected, and how correctness was verified.

## Project layout

```
src/app/           # pages + API routes
src/components/    # editor, dashboard, UI kit
src/lib/           # auth, store, import
docs/              # architecture + AI notes + assets
tests/             # Vitest
scripts/e2e-live.mts
```

## Stack

Next.js 15 · React 19 · TypeScript · TipTap · Supabase · jose · bcryptjs · Vitest · Vercel

---

**Maintained:** Jul 2026 · demo + docs kept in sync with the live Vercel deploy.
