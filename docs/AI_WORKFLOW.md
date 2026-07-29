# AI Workflow Note — DocsLite

## Tools used

- **Cursor Agent (Composer)** — scaffold Next.js app, Prisma schema, TipTap editor wiring, API routes, UI, tests, docs
- **Manual verification** — local `prisma db push`, seed, Vitest, production build, click-through of login/edit/share flows before submit

## Where AI sped up work

- Scaffolding App Router pages + Prisma models + seed users in one pass
- TipTap toolbar + autosave client component boilerplate
- Import parser (txt/md → HTML) and Vitest cases
- Stakeholder-ready README / architecture / submission drafts

## What AI output was changed or rejected

- Rejected expanding into realtime CRDT / Yjs (stretch; high risk under remaining time)
- Rejected DOCX parsing libraries (scope lock: `.txt`/`.md` only)
- Rejected Prisma 7 default install; pinned **Prisma 5** so classic SQLite datasource works without driver adapters
- Tightened share UX to seeded user select (no invite-by-email signup) for reliable demo
- Avoided claiming features not wired (comments, version history, PDF)
- Replaced browser `confirm()` with in-app ConfirmDialog; added Modal/Toast/Button/Badge kit for delete, revoke, share, and status feedback

## How correctness / UX / reliability were verified

1. Demo credentials work on live Vercel + Supabase
2. `npm test` → 4 import/title tests pass
3. `npm run build` → production compile
4. Manual QA checklist (human):
   - Alice creates doc, edits formatting, refresh → content persists
   - Alice shares with Bob → Bob sees under Shared
   - Bob edits as editor → Alice sees updates after reopen
   - Import sample `.md` → new owned doc
   - Viewer role blocks writes when set
   - Delete and revoke use in-app confirm dialogs (Cancel / Confirm), not browser chrome
   - Autosave status badge updates without native alerts

## Process lesson (vs prior overclaim risk)

Docs and video only state flows that were clicked on the running app. Incomplete items are listed explicitly under deprioritized / next hours.
