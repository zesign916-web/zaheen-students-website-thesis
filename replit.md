# Zaheen Student.AI

A full-stack AI chat app for Pakistani university students that remembers important facts across conversations and uses those memories to personalize every response.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `OPENAI_API_KEY` — OpenAI API key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifacts/chat-app), served at `/`
- API: Express 5 (artifacts/api-server), served at `/api`
- DB: PostgreSQL + Drizzle ORM
- AI: OpenAI gpt-4o-mini (chat + memory extraction)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — DB schema (conversations, messages, memories)
- `artifacts/api-server/src/routes/conversations.ts` — chat + streaming routes
- `artifacts/api-server/src/routes/memories.ts` — memory CRUD routes
- `artifacts/api-server/src/lib/openai.ts` — OpenAI client (uses OPENAI_API_KEY)
- `artifacts/chat-app/src/` — React frontend

## Architecture decisions

- Memory extraction runs async after each AI response (non-blocking to the SSE stream)
- Memories are injected into the system prompt before each AI response
- SSE streaming used for real-time AI responses (not WebSockets)
- Single user model (no auth) — all memories are global
- gpt-4o-mini used for both chat responses and memory extraction (cost-effective)

## Product

Users chat with an AI assistant via a ChatGPT-style interface. After each exchange, the AI automatically extracts and saves long-term facts (profession, preferences, goals). On subsequent messages, those memories are injected into the system prompt so the AI responds with full context — it remembers you across conversations and sessions.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always restart api-server workflow after changing backend code (it needs to rebuild)
- Memory extraction happens asynchronously after each message — there may be a short delay before new memories appear in the sidebar
- The OPENAI_API_KEY is used directly (not via Replit AI Integrations)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
