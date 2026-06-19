# Parzley UI seed — external builds

**Purpose:** Give another app (or another Cursor workspace) enough visual DNA to **look and interact like Parzley** without copying compliance-specific features (standards, assessments, target documents, n8n artifacts, etc.).

**How to use in Cursor:** Paste or `@`-reference this file at the start of a greenfield build. Tell the agent: *“Use `docs/design-system/external-build-ui-seed.md` and `semantic-themes.tokens.json` for all color and interaction decisions. Do not invent new semantic color families.”*

**Companion artifacts:**

- [`semantic-themes.tokens.json`](./semantic-themes.tokens.json) — color tokens
- [`typography.md`](./typography.md) + [`typography.tokens.json`](./typography.tokens.json) — font sizes, weights, and treatments

Copy these into the new repo for machine-readable styling.

**In-repo source of truth (Parzley app):** `utils/semanticThemes.ts` must stay aligned with the color JSON. Product-specific migration history lives in [`theming.md`](./theming.md).

---

## 1. Core rule

Colors express **what kind of thing** the user is looking at, not billing tier, HTTP status, or random decoration.

| Bucket | Tailwind family | Use for |
|--------|-----------------|--------|
| **Primary workflow** | indigo | Active jobs, pipelines, review queues, “continue” flows |
| **User-authored** | emerald | Items the user created or can edit |
| **Curated library** | fuchsia | Official / read-only catalogue or template library |
| **Commerce & utilities** | slate | Checkout, top-up, settings, debug tools |
| **Neutrals** | gray | Page chrome, cards on white, metadata |
| **Brand** | `#4C9B2D` | Logo, marketing wordmark only — not workflow UI |

**Do not** use blue, violet, sky, or purple for workflow identity. **Do not** use brand green for buttons in the signed-in app shell.

---

## 2. Full theme tokens (Tailwind classes)

These match `utils/semanticThemes.ts` in the Parzley repo.

### Primary workflow (indigo)

| Role | Class |
|------|-------|
| Border | `border-indigo-200` |
| Border hover | `hover:border-indigo-300` |
| Panel background | `bg-indigo-50` |
| Panel background (muted) | `bg-indigo-50/40` |
| Panel hover | `hover:bg-indigo-100` |
| Accent text | `text-indigo-700` |
| Accent text (muted) | `text-indigo-600` |
| Strong accent text | `text-indigo-900` |
| Primary button | `bg-indigo-600` + `hover:bg-indigo-700` + `text-white` |
| Outline button border | `border-indigo-200` |
| Outline button text | `text-indigo-700` |
| Outline button hover wash | `hover:bg-indigo-50` |
| Pill | `bg-indigo-100` `text-indigo-800` |
| Selected ring | `ring-1 ring-indigo-100` |

Inline hex (charts, canvas, legacy widgets): **primary** `#4F46E5`, **secondary** `#4338ca`.

### User-authored (emerald)

| Role | Class |
|------|-------|
| Border | `border-emerald-200` |
| Border hover | `hover:border-emerald-300` |
| Panel background | `bg-emerald-50` |
| Panel background (muted) | `bg-emerald-50/40` |
| Panel hover | `hover:bg-emerald-100` |
| Accent text | `text-emerald-700` |
| Accent text (muted) | `text-emerald-600` |
| Strong accent text | `text-emerald-900` |
| Primary button | `bg-emerald-600` + `hover:bg-emerald-700` + `text-white` |
| Outline button border | `border-emerald-200` |
| Outline button text | `text-emerald-700` |
| Outline button hover wash | `hover:bg-emerald-50` |
| Pill | `bg-emerald-100` `text-emerald-800` |
| Selected ring | `ring-1 ring-emerald-100` |

### Curated library (fuchsia)

| Role | Class |
|------|-------|
| Border | `border-fuchsia-200` |
| Border hover | `hover:border-fuchsia-300` |
| Panel background | `bg-fuchsia-50` |
| Panel background (muted) | `bg-fuchsia-50/40` |
| Panel hover | `hover:bg-fuchsia-100` |
| Accent text | `text-fuchsia-700` |
| Accent text (muted) | `text-fuchsia-600` |
| Strong accent text | `text-fuchsia-900` |
| Primary button | `bg-fuchsia-600` + `hover:bg-fuchsia-700` + `text-white` |
| Outline button border | `border-fuchsia-200` |
| Outline button text | `text-fuchsia-700` |
| Outline button hover wash | `hover:bg-fuchsia-50` |
| Pill | `bg-fuchsia-100` `text-fuchsia-800` |
| Selected ring | `ring-1 ring-fuchsia-100` |

### Commerce & utilities (slate)

Not in `semanticThemes.ts` but used consistently for purchase and neutral tooling:

| Role | Class |
|------|-------|
| Primary commerce button | `bg-slate-800` `hover:bg-slate-900` `text-white` |
| Outline utility | `border-slate-200` `text-slate-700` `hover:bg-slate-50` |
| Panel border | `border-slate-200` |
| Body copy | `text-slate-600` |
| Headings | `text-slate-900` |
| Modal scrim | `bg-slate-900/35` |
| Tooltip (dark) | `bg-slate-900` `text-slate-100` `border-slate-600` |

### Brand (marketing only)

```text
#4C9B2D
```

Use for logo accents and public landing hero emphasis — not signed-in workflow chrome.

---

## 3. Interaction hierarchy

Apply **one semantic bucket** per surface, then pick control weight:

### Filled primary button

- Highest emphasis: **Continue**, **Start**, **Save**, **Generate**, **Use** (when it advances workflow).
- Classes: `{bucket}.filledButton` + `{bucket}.filledButtonHover` + `text-white` + `rounded-lg` + `text-xs` or `text-sm` + `font-semibold` or `font-bold`.
- One filled primary per card/row; secondary actions must look lighter.

### Outline secondary button

- **View**, **Preview**, **Open details**, secondary navigation.
- White/light background + colored border and text from the same bucket + `hover:bg-{family}-50`.

### Pills / badges

- Metadata only: **LITE**, **NEW**, **ALLOCATED**, category tags.
- Compact: `text-[10px]` or `text-[11px]`, `font-semibold` or `font-bold`, `rounded-md` or `rounded-full`, bucket pill colors.
- Must not compete visually with filled primaries.

### Tabs / mode switchers

- Active tab: bucket border + bucket text on white; inactive: neutral `text-slate-600` / transparent border.
- Example pattern: active `border-fuchsia-200 text-fuchsia-700`, inactive `border-transparent text-slate-600 hover:bg-slate-50`.

### Cards and panels

- Outer: `rounded-xl border` + bucket `border` + optional bucket `background` or white inner.
- Hover on clickable cards: `borderHover` + `backgroundHover` from bucket.
- Dense lists: slightly smaller radius (`rounded-lg`) and tighter padding.

---

## 4. App shell & global chrome

Match Parzley’s light, dense B2B feel:

| Element | Classes / values |
|---------|------------------|
| Page background | `bg-gray-50 text-gray-900 antialiased` |
| Main surfaces | `bg-white` |
| Default borders | `border-gray-200` |
| Muted copy | `text-gray-600` |
| Strong labels | `text-gray-800` |
| Layout | Full-height app: `h-screen overflow-hidden` on body; scroll inside panels |

### Typography

**Full spec:** [`typography.md`](./typography.md) — font families, operational vs marketing modes, role tables, weights, tracking, and when to use each size.

**Quick rules for external builds:**

| Mode | When | Default body | Page title |
|------|------|--------------|------------|
| **Operational** | Signed-in app, dashboards, dense lists | `text-[11px] leading-snug text-gray-600` | `text-2xl font-black text-gray-900` |
| **Marketing / auth** | Landing, signup, pricing | `text-sm font-medium text-gray-700 leading-relaxed` | `text-3xl font-black tracking-tight md:text-4xl` |

- **Font:** system `font-sans` only; `font-mono` for IDs and code blocks.
- **Buttons (operational):** `text-xs font-semibold` on primary CTAs.
- **Pills / section labels:** `text-[10px]`–`text-[11px]` `font-bold` `uppercase` `tracking-wide` (or wider).
- **Do not** default dense UI to `text-base` — Parzley operational UI is intentionally compact.

Use `typography.tokens.json` → `roles.operational` / `roles.marketing` for copy-paste class strings.

### Radius & shadow

- Cards: `rounded-xl`
- Buttons / inputs: `rounded-lg`
- Small chips: `rounded-md`
- Shadows: light only — `shadow-sm`, `shadow-md` on hover cards; modals `shadow-xl`

### Scrollbars (optional parity)

WebKit scrollbar styling used in Parzley `index.html`:

- Track: `#f3f4f6` (gray-100)
- Thumb: `#d1d5db` (gray-300), hover `#9ca3af` (gray-400)
- Width/height: 8px, thumb `border-radius: 4px`

### Stack assumption

Parzley ships **Tailwind CSS v3** (CDN or build). Use the **default Tailwind palette** — no custom `tailwind.config` color extensions required for these tokens.

Icons: **lucide-react**, stroke icons, sizes 14–22px beside labels.

---

## 5. Mapping buckets to a generic app

You do **not** need Parzley domains. Map features to buckets:

| Your feature (examples) | Bucket |
|-------------------------|--------|
| Dashboard of active tasks / runs | Primary workflow (indigo) |
| Draft the user is editing | User-authored (emerald) |
| Browse official templates / marketplace | Curated library (fuchsia) |
| Billing, upgrade, account billing | Commerce (slate) |
| Settings, API keys, admin debug | Commerce (slate) |
| Page layout, tables, empty states | Neutrals (gray + white) |

**Handoff rule:** When navigation moves from library → active work, switch accent from **fuchsia** to **indigo** on the CTA that starts the job (e.g. “Open workspace” stays indigo even if the user came from a fuchsia catalogue card).

---

## 6. Optional: dense list accent pair

For **compact queues** only (Parzley Assessments list), a second layer distinguishes row types without a fourth global theme:

| Row flavor | Icon | Badge |
|------------|------|-------|
| Official / system-provided row | `text-slate-600` | `border-slate-200 bg-slate-100 text-slate-800` |
| User-owned row | `text-amber-700` | `border-amber-200 bg-amber-50 text-amber-900` |

Primary row CTA still uses **indigo** filled. Use this pair only when you need two entity types in one dense list; otherwise stick to the three semantic themes.

---

## 7. Status & feedback (not semantic buckets)

Keep these **separate** from indigo/emerald/fuchsia identity:

| Meaning | Typical classes |
|---------|-----------------|
| Error / destructive | `rose-600`, `border-rose-200`, `bg-rose-50` |
| Warning | `amber-600` (counts, cautions — not user-authored identity) |
| Success check | `emerald-600` text only (not full emerald panels) |
| Neutral info | `slate` panels, not `blue` info boxes |

---

## 8. Anti-patterns

- Do not assign **violet / sky / blue-600** to primary workflow surfaces.
- Do not use **brand green** (`#4C9B2D`) for in-app primary buttons.
- Do not use **tier names** (Lite, Pro) as full-card color systems — neutral pills only.
- Do not mix **indigo and blue** for the same workflow type.
- Do not add a fourth “hero” color without updating this seed and the JSON tokens.

---

## 9. Minimal implementation sketch

**React + Tailwind:** Copy token objects from `semantic-themes.tokens.json` or mirror `utils/semanticThemes.ts`. Join classes with a small helper:

```ts
export function themeCx(...parts: Array<string | false | undefined | null>): string {
  return parts.filter(Boolean).join(' ');
}
```

**Example primary button:**

```tsx
<button
  className={themeCx(
    primaryWorkflow.filledButton,
    primaryWorkflow.filledButtonHover,
    'text-white rounded-lg px-3 py-1.5 text-xs font-semibold'
  )}
>
  Continue
</button>
```

**Example catalogue card:**

```tsx
<div className={themeCx('rounded-xl border p-4', curatedLibrary.border, curatedLibrary.background)}>
  ...
</div>
```

---

## 10. What this seed intentionally omits

- Parzley ontology (Codified Standard, Target Document, Assessment, etc.)
- n8n / Mongo artifact types (`ux_*`)
- Route map and feature-specific layouts
- Marketing page drift cleanup lists

For Parzley-internal migration notes, see [`theming.md`](./theming.md).

---

## 11. Sync checklist (maintainers)

When changing colors in the Parzley app:

1. Update `utils/semanticThemes.ts`
2. Update `docs/design-system/semantic-themes.tokens.json`
3. Update `docs/design-system/typography.md` + `typography.tokens.json` if text styles change
4. Update this file if interaction rules change
5. Update `theming.md` for in-app semantic naming
6. Bump `version` in the JSON files
