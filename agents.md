# Agent Operating Notes

This file captures the current decisions for auth, configuration, and deployment.

## Current Architecture

- Frontend: Next.js app router chat UI.
- Auth: Supabase email magic link.
- API boundary: frontend calls local `/api/*` routes only.
- Dify access: server-side only via `dify-client` in API routes.
- Dify adapter boundary: all Dify SDK calls are routed through `app/api/utils/dify-adapter.ts`.
- User identity passed to Dify: `user:<supabase_user_id>`.

## Security Rules

- Never expose Dify API keys in browser code.
- Never use `NEXT_PUBLIC_*` for Dify secrets.
- Keep Dify key in server-only env var.
- Keep deterministic behavior: if auth or config is missing, return clear errors (no fallback logic).

## Required Environment Variables

Set these in `.env.local` and in Cloud Run service env vars:

- `DIFY_API_BASE_URL`  
  Example: `https://api.dify.ai/v1`
- `DIFY_APP_API_KEY_KN_COLD`
  Current active agent key expected by server code.
- `NEXT_PUBLIC_SUPABASE_PROJECT_URL`  
  Supabase project URL (public).
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`  
  Supabase publishable/anon key (public).

## Multi-Agent Env Naming Convention

For each client+agent pair, use this deterministic pattern:

- `DIFY_APP_ID_<CLIENT>_<AGENT>`
- `DIFY_APP_API_KEY_<CLIENT>_<AGENT>`

Example:

- `DIFY_APP_ID_KN_COLD`
- `DIFY_APP_API_KEY_KN_COLD`

Naming rules:

- Use uppercase only.
- Use underscores only.
- No spaces or hyphens.
- Keep `<CLIENT>` and `<AGENT>` stable once assigned.

## Supabase Setup

1. Authentication -> Sign In / Providers -> enable Email.
2. Authentication -> URL Configuration:
   - Site URL: app URL (`http://localhost:3000` for local).
   - Redirect URLs: include `/auth/callback` for local and production domains.
3. Project Settings -> API:
   - Copy project URL and publishable key into env vars above.

## Cloud Run Notes

- Deployment path is Docker-based.
- Container listens on `PORT=8080`.
- `Dockerfile` uses Next.js standalone output.
- Ensure Cloud Run env vars include all required values listed above.
- For production auth callback, add:
  - `https://<your-domain>/auth/callback` in Supabase Redirect URLs.

## Git/Secrets Hygiene

- `.gitignore` is set to ignore all `.env*` except `.env.example`.
- `.env.example` should contain placeholders only (no real project values).

## Planned Multi-Agent Model (Next Step)

For role/profile-based agent access:

- Store user-to-agent access in Supabase tables.
- Resolve allowed agent at request time in server routes.
- Keep per-agent Dify keys in a secret store (recommended: Google Secret Manager), not in frontend or public env vars.

## Dify Upgrade Strategy

- Keep `/api/*` as the stable internal contract used by the frontend.
- Keep all Dify-specific request/response handling inside `app/api/utils/dify-adapter.ts`.
- When Dify releases changes, update adapter logic first and avoid direct frontend coupling to Dify SDK/event shapes.
