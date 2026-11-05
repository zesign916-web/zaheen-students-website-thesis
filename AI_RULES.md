# AI_RULES.md

## Tech stack
- The repository is a pnpm workspace monorepo with TypeScript packages.
- The web client is React, built and served with Vite, in `artifacts/chat-app/`.
- Client routing is handled by Wouter; keep page routes and navigation consistent with the existing `src/App.tsx` setup.
- Client styling uses Tailwind CSS, with shadcn/ui-style components built on Radix UI primitives.
- The API is an Express 5 server written in TypeScript, in `artifacts/api-server/`.
- PostgreSQL persistence uses Drizzle ORM and schema definitions in `lib/db/`.
- Zod is used for runtime validation and shared API schemas; generated API client/types live under `lib/api-client-react/` and `lib/api-zod/`.
- AI integrations use the OpenAI and Google Generative AI SDKs, with shared integration packages under `lib/`.
- React Query manages client-side API data fetching and caching; use the shared generated API client where applicable.

## Library and implementation rules
- Use React function components and TypeScript for UI code. Keep client application code in `artifacts/chat-app/src/`, reusable UI in `src/components/`, and route-level screens in `src/pages/`.
- Use Wouter for client-side routing. Do not introduce another router or put routes in a separate routing system.
- Use Tailwind utility classes for styling. Prefer existing design tokens and patterns in `src/index.css`; do not add a separate styling framework.
- For standard interactive UI (dialogs, menus, selects, tabs, tooltips, etc.), use existing components from `src/components/ui/` (shadcn/ui patterns backed by Radix). Do not edit those generated UI primitives unless explicitly required; compose them in feature components instead.
- Use `lucide-react` for icons. Avoid adding an icon library when an existing icon is available.
- Use React Query for asynchronous API state and the workspace-generated React API client for calls matching the OpenAPI contract. Do not duplicate generated API request logic.
- Use Zod at untrusted input/API boundaries for validation. Keep API request and response types aligned with `lib/api-spec/openapi.yaml` and generated schemas; do not hand-edit generated files.
- Implement server endpoints in `artifacts/api-server/src/routes/` and mount them through the existing route index. Use Express middleware for cross-cutting concerns and keep business behavior in the relevant route/module.
- Use Drizzle ORM for database queries and schema changes. Define tables in `lib/db/src/schema/`; do not write raw SQL when the equivalent Drizzle query is clear. Coordinate schema updates with the existing Drizzle workflow.
- Keep OpenAI and Google AI SDK usage on the server in `artifacts/api-server/` or the server integration package. Never expose provider credentials or make privileged model calls directly from the browser.
- Use Pino (`pino`/`pino-http`) for server logging, following the existing logger utilities; do not use console logging for production server behavior.
- Reuse existing workspace packages and dependencies before introducing new libraries. Add dependencies only when existing tools cannot meet the requirement, and keep generated/build artifacts out of hand-maintained source changes.
- Preserve established package boundaries: browser-only code belongs in the chat app, server-only code belongs in the API server, and shared schemas/client/database code belongs in `lib/`.
