<p align="center">
  <img src="docs/assets/docslite-banner.png" alt="DocsLite — Create · Edit · Share" width="720" height="190" />
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/NEXT.JS-15-black?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/REACT-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TYPESCRIPT-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="TipTap" src="https://img.shields.io/badge/TIPTAP-EDITOR-A78BFA?style=for-the-badge" />
  <img alt="Supabase" src="https://img.shields.io/badge/SUPABASE-POSTGRES-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img alt="Vercel" src="https://img.shields.io/badge/VERCEL-DEPLOY-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</p>

<p align="center">
  <strong>AI-native collaborative document editor</strong> — create, rich-edit, import, share, and persist with a product-minded MVP slice.
</p>

<p align="center">
  <a href="https://app-blush-seven-53.vercel.app">Live demo</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#what-ships">What ships</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#ai-native-workflow">AI workflow</a> ·
  <a href="#demo-accounts">Demo accounts</a>
</p>

---

## Why this exists

DocsLite was built as a **focused full-stack product slice** under a tight timebox: not a Google Docs clone, but a coherent editor with ownership, sharing, import, persistence, and a live deployment reviewers can click through.

It is **AI-native in how it was engineered** (decomposition, iteration, verification) — the product itself is a collaborative docs MVP with deliberate scope cuts.

## Live demo

**URL:** [https://app-blush-seven-53.vercel.app](https://app-blush-seven-53.vercel.app)

### Demo accounts

| User | Email | Password | Role |
|------|-------|----------|------|
| Alice | `alice@ajaia.demo` | `password123` | Owner |
| Bob | `bob@ajaia.demo` | `password123` | Collaborator |

Try: sign in as Alice → create/edit → Share with Bob → sign out → sign in as Bob → open **Shared with you**.

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

## License

Private assessment / portfolio piece unless otherwise noted.
