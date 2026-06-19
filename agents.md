# Agent Operating Notes

This file captures the current decisions for auth, configuration, and deployment.

## Current Architecture

- Frontend: Next.js app router chat UI.
- Auth: Supabase email magic link.
- Access model: Invite-only; self-signup disabled in frontend and Supabase.
- API boundary: frontend calls local `/api/*` routes only.
- Dify access: server-side only via `dify-client` in API routes.
- Dify adapter boundary: all Dify SDK calls are routed through `app/api/utils/dify-adapter.ts`.
- User identity passed to Dify: `user:<supabase_user_id>`.
- Multi-agent UI: top-right nav-style agent selector with unique icons and overflow safety.
- Conversation naming: conversation titles are prefixed with active agent name.
- Welcome/chat flow: welcome panel stays visible for new conversations; chat input is available immediately (no "Start Chat" gate button).
- Branding assets: app icon uses `public/Parzley_logo.png`, metadata icon uses `public/Parzley_favicon.png`.
- Input Method: Speech-to-Text (STT) enabled via mic icon in the chat composer.
- User Identity: User initials displayed in chat bubbles, sourced from `public.user_profiles`.
- Admin console: master admins are routed to `/admin` after login and manage users/organisations/agent access from app UI.
- Versioning: Unified version display (`APP_BUILD_VERSION`) in sidebar footer.
- Layout: Full-height app (`h-screen overflow-hidden`) with internal panel scrolling.
- Chat UI: 90% width chat area and input panel; darkened user bubbles (`bg-indigo-700`) for contrast.
- Title Bar: Light gray (`bg-gray-50`) title bar in main chat, matched to sidebar height (60px).

## Security Rules

- Never expose Dify API keys in browser code.
- Never use `NEXT_PUBLIC_*` for Dify secrets.
- Keep Dify key in server-only env var.
- Keep deterministic behavior: if auth or config is missing, return clear errors (no fallback logic).
- RLS: `public.user_profiles` is strictly user-scoped (select/insert/update own row only).

## Required Environment Variables

Set these in `.env.local` and in Cloud Run service env vars:

- `DIFY_API_BASE_URL`  
  Example: `https://api.dify.ai/v1`
- `DIFY_APP_API_KEY_KN_COLD`
  Dify key for KN_COLD.
- `DIFY_APP_API_KEY_KN_CUSTOMER`
  Dify key for KN_CUSTOMER.
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

## Supabase MCP Target Project

Use this Supabase project for schema/profile updates in this workspace:

- Project name: `Auth`
- Project ref/id: `mmodeelpvztldlfknasc`
- Database host: `db.mmodeelpvztldlfknasc.supabase.co`

## User Profiles (Implemented)

Table: `public.user_profiles`

- `user_id` (uuid, pk, references `auth.users.id`)
- `display_name` (text)
- `first_name` (text)
- `last_name` (text)
- `initials_override` (text, 1-4 chars)
- `avatar_url` (text)
- `is_master_admin` (boolean, default `false`)
- `is_disabled` (boolean, default `false`)
- `must_change_password` (boolean, default `false`)
- `password_changed_at` (timestamptz)
- `created_at` / `updated_at` (timestamptz)

Initials derivation logic (server-side):
1. `initials_override` (if set)
2. `display_name` initials
3. `first_name + last_name` initials
4. Email initial
5. Fallback: "U"

## Agent Catalogue + Welcome Panel (Implemented)

- Canonical agent metadata lives in `public.agent_catalog`.
- `agent_catalog` includes: `agent_id`, `display_name`, `description`, `is_active`.
- `/api/agents` returns agent `id`, `name`, and `description` for the signed-in user based on assignment rules.
- Welcome panel now renders `Welcome to <Agent Name>` using the selected agent and shows that agent's description.
- If no description is set for an agent, the UI falls back to the app-level description.

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

## Local Dev Runtime Recovery

If local dev shows chunk/module errors such as:

- `Cannot find module './xxxx.js'` from `.next/server/webpack-runtime.js`
- `ENOENT` for `.next/server/app/page.js` or app manifests

Recover with deterministic steps:

1. Stop all `node`/`next dev` processes (including stale listeners on ports 3000-3004).
2. Delete `.next`.
3. Start one clean `npm run dev` session only.
4. Hard refresh browser (`Ctrl+F5`) and use only the currently active local port.

## Branding Status

- App shell branding pass is implemented (logo, favicon, typography/colors, header/nav updates).
- Welcome panel and value panels aligned with design system (Lucide icons, border-based panels).
- Remaining branding work: per-customer dynamic name/logo/theme and Supabase/Auth email template branding.

## Planned Multi-Tenant Model (Next Step)

For role/profile-based agent and branding access:

- Store customer profile (display name, logo path, optional theme settings) in Supabase.
- Store user-to-customer and customer-to-agent access in Supabase tables.
- Resolve active customer and allowed agent set at request time in server routes.
- Keep per-agent Dify keys in a secret store (recommended: Google Secret Manager), not in frontend or public env vars.

## Supabase Schema (Proposed)

Use UUID primary keys and `created_at`/`updated_at` timestamps on all tables.

### `customers`

- `id` (uuid, pk)
- `slug` (text, unique, stable identifier)
- `display_name` (text, required)
- `logo_storage_path` (text, required, e.g. `brand-assets/<customer-id>/logo.png`)
- `theme_json` (jsonb, optional)
- `status` (text, required, e.g. `active|disabled`)

### `user_customer_access`

- `id` (uuid, pk)
- `user_id` (uuid, required, references `auth.users.id`)
- `customer_id` (uuid, required, references `customers.id`)
- `role` (text, required, e.g. `admin|member`)
- Unique constraint on (`user_id`, `customer_id`)

### `customer_agent_access`

- `id` (uuid, pk)
- `customer_id` (uuid, required, references `customers.id`)
- `agent_id` (text, required; app-facing agent identifier, e.g. `KN_COLD`)
- `agent_display_name` (text, required)
- `is_default` (boolean, required, default `false`)
- Unique constraint on (`customer_id`, `agent_id`)
- Partial unique index for one default per customer: unique (`customer_id`) where `is_default = true`

## RLS Policy Intent (Deterministic)

- `customers`: user can `select` only customers linked via `user_customer_access`.
- `user_customer_access`: user can `select` only rows where `user_id = auth.uid()`.
- `customer_agent_access`: user can `select` only rows where `customer_id` is in user-linked customers.
- No anonymous writes to these tables from client.
- Admin workflows perform provisioning updates server-side only using server-only secrets.
- Bootstrap API must hard fail if any required contract field is missing (`display_name`, `logo_storage_path`, default agent).

## Agent Switching & State Management

- **Deterministic Reset**: When switching agents, the frontend must reset `currConversationId` to `-1`, clear `chatList`, and set `inited` to `false` *before* updating `activeAgentId`. This prevents race conditions where the UI might attempt to fetch messages for a stale conversation ID with a new agent ID.
- **Graceful Recovery**: If a `fetchChatList` call fails (e.g., "Conversation Not Exists"), the system must automatically reset to a new conversation state (`-1`) rather than showing an error screen.
- **No Blank Screens**: Avoid setting `promptConfig` to `null` during agent switches to maintain UI stability.

## Dify Upgrade Strategy

- Keep `/api/*` as the stable internal contract used by the frontend.
- Keep all Dify-specific request/response handling inside `app/api/utils/dify-adapter.ts`.
- When Dify releases changes, update adapter logic first and avoid direct frontend coupling to Dify SDK/event shapes.

## 2026-06-18 Chat Rendering and Layout Decisions

- **Markdown compatibility lock**: `react-markdown@8.0.7` must stay aligned with `remark-gfm@3.0.1` and `remark-breaks@3.0.3` to prevent `inTable` runtime crashes.
- **Canonical markdown path**: keep `StreamdownMarkdown` as the single renderer for completed assistant content (including tables).
- **Streaming safety rule**: while responses are in flight, render content as plain text; render full markdown only after completion.
- **Table styling choice**: medium-contrast table theme with zebra rows in chat answer and thought blocks; reduced corner radius to `4px`.
- **Chat layout rule**: composer remains fixed to bottom; chat list reserves bottom space so messages never render behind the input bar.
- **Chat scroll rule**: auto-scroll follows new/updated assistant output in the active conversation.
- **Message feedback behavior**: like/dislike is app UI that posts to `/api/messages/{messageId}/feedbacks`; backend forwards to Dify `messageFeedback` for persistence.

## Backlog: Usage Tracking (Supabase)

- **Goal**: add a lightweight, extensible usage analytics foundation now, then expand events as agents mature.
- **Storage**: create an append-only `usage_events` table in Supabase as the canonical event stream.
- **Initial events**: `login_success`, `conversation_created`, `message_sent`, `message_completed`, `agent_selected`, `user_disabled`, `user_enabled`.
- **Required event fields**: `event_type`, `occurred_at`, `user_id`, `customer_id`, `agent_id`, `conversation_id`, `message_id`, `request_id`, `status`, `duration_ms`, `metadata_json`.
- **Implementation rule**: emit usage events from server-side routes only (deterministic contract, no fallback parsing).
- **Phase 1 deliverable**: schema + server event writer utility + wiring into auth/session, conversations, and messaging APIs.
- **Phase 2 deliverable**: admin usage view and optional daily rollup table for fast aggregates.

## Password Change Enforcement (Implemented)

- Admin-created users are provisioned with `user_profiles.must_change_password = true`.
- Authenticated entry points (`/` and `/admin`) block normal access and route users to `/change-password` until the password is updated.
- Successful password updates clear `must_change_password` and stamp `password_changed_at`.
- Admin password resets set `must_change_password = true` again for deterministic re-enforcement.
