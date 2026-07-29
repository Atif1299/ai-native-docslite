# Architecture — DocsLite

## Product judgment

Ship a **credible editing + sharing slice**, not a Google Docs clone. Core path: login → create/edit/save → refresh reopen → import file → share → second user sees Shared list.

## Priorities (timeboxed)

1. Persistence + reopen (trust)
2. TipTap rich text (editing UX)
3. Owned / Shared + grant access (collaboration proof)
4. `.txt`/`.md` import (upload path without DOCX complexity)
5. Deploy + one automated test + honest docs

## System shape

```
Browser (React)
  → Next.js App Router pages (SSR for auth gate)
  → Route handlers (/api/auth, /api/documents, /api/users)
  → Supabase Postgres (User / Document / DocumentShare)
```

### Auth

- Seeded users only (no signup) to keep demo deterministic
- HTTP-only JWT cookie (`jose`), 7-day expiry
- Server checks ownership or `DocumentShare` before read/write

### Documents

- `content` stored as HTML from TipTap
- Autosave (~1.2s debounce) + manual Save
- Owner can delete; editors can write; viewers read-only

### Sharing

- Owner grants access by selecting another seeded user
- Roles: `editor` | `viewer`
- Unique `(documentId, userId)` prevents duplicates

### Import

- Multipart upload to `/api/documents/import`
- Lightweight markdown → HTML conversion; HTML escaped for safety
- Explicitly rejects non-`.txt`/`.md`

## Tradeoffs

| Choice | Why | Cost |
|--------|-----|------|
| TipTap | Fast, solid rich-text baseline | Not Google Docs parity |
| Supabase Postgres + anon key | Works on Vercel serverless without DB password in CLI | Demo RLS is open; tighten before production product |
| Cookie sessions | Simple for reviewers | Not OAuth / org SSO |
| No realtime | Avoids Yjs/WebSocket complexity under timer | Multi-user is share-then-reload, not live cursors |

## Next 2–4 hours (if continuing)

1. Postgres on Neon/Supabase + Vercel env
2. Presence / last-saved-by indicator
3. Export Markdown
4. API permission test with cookie jar
