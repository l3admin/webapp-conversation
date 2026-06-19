# Parzley typography

**Purpose:** When to use which font family, size, weight, and text treatment in Parzley UI.

**Portable seed:** [`external-build-ui-seed.md`](./external-build-ui-seed.md) (colors + shell). This file is the typography companion.

**Machine-readable:** [`typography.tokens.json`](./typography.tokens.json)

**Stack:** Tailwind CSS v3 default theme (CDN or build). No custom webfonts — the app uses the **system sans-serif** stack via `font-sans`.

---

## 1. Font families

| Family | Tailwind | Use for |
|--------|----------|---------|
| **UI sans (default)** | `font-sans` (default on `<body>`) | All product UI, marketing, forms, tables |
| **Monospace** | `font-mono` | Artifact IDs, run IDs, debug payloads, JSON/code blocks, logo text fallback when the image fails |
| **Do not use** | `font-serif` | Not part of the Parzley product look |

**Body default** (signed-in shell and most pages):

```text
font-sans antialiased
```

**Brand wordmark fallback** (logo image error only): `text-lg` or `text-xl` `font-bold` `font-mono` — not for general headings.

---

## 2. Two typography modes

Parzley uses **two scales**. Pick the mode from surface type, not personal preference.

| Mode | Where | Size system |
|------|-------|-------------|
| **Operational** | Workspace home, Assessments, Standards Library, Document Analyzer, Assessment Detail, Session Brain, dense cards/rows | Mostly **custom pixel sizes** `text-[8px]`–`text-[13px]`, plus `text-xs` / `text-sm` / `text-lg` for selected headings |
| **Marketing & auth** | Landing, pricing, signup, password reset, long-form static pages | Tailwind **named scale** `text-xs` → `text-4xl` |

Operational UI is **dense** (more rows per screen). Marketing UI is **comfortable** (more whitespace, larger headings).

---

## 3. Operational type roles

Use these roles in signed-in product surfaces. Classes are copy-paste ready.

### Page structure

| Role | Classes | When |
|------|---------|------|
| **Eyebrow / kicker** | `text-[10px] font-bold uppercase tracking-widest text-gray-400` | Small label above a page title (“Library”, section context) |
| **Page title** | `text-2xl font-black text-gray-900` | Primary H1 in page body (e.g. Assessments header card) |
| **Workspace section title** | `text-lg font-bold tracking-tight text-gray-900` | In-page mode title (“Analyses”, “Standards”) |
| **Shell title** (rare) | `text-sm font-bold text-gray-800 truncate` | Legacy global header title — prefer in-page titles |

### Section & group labels

| Role | Classes | When |
|------|---------|------|
| **Section label (light)** | `text-[10px] font-semibold uppercase tracking-wide text-gray-500` | Field group captions on white (e.g. “Requirement statement”) |
| **Section label (dense)** | `text-[10px] font-extrabold uppercase tracking-wide` + semantic/neutral color | Artifact group headings in expandable rows |
| **Section label (alternate dense)** | `text-[11px] font-extrabold uppercase tracking-wide` | Same as above when slightly more legibility is needed |
| **Dark tooltip section title** | `text-[10px] font-black uppercase tracking-wide text-slate-300` | Heading inside dark tooltips (`bg-slate-900`) |
| **Accordion / column header** | `text-xs font-semibold uppercase tracking-wider text-slate-500` | “Catalog Templates”, usage breakdown columns |

### Body & metadata

| Role | Classes | When |
|------|---------|------|
| **Body (standard)** | `text-sm font-medium text-gray-600` or `text-gray-700` | Intro copy under page title, panel descriptions |
| **Body (dense)** | `text-[11px] leading-snug text-gray-600` or `text-gray-700` | Card copy, explainer text, pricing feature lists in compact panels |
| **Body (relaxed block)** | `text-[11px] leading-relaxed` or `text-sm leading-relaxed` | Longer paragraphs in modals, help text |
| **Metadata / rail** | `text-[11px]` + `text-gray-600` or semantic muted accent | Single-line run metadata, secondary facts |
| **Muted helper** | `text-[11px] text-gray-500` | Timestamps, low-priority hints |
| **Micro label (chart / tile)** | `text-[8px] font-bold uppercase leading-snug tracking-wide text-gray-500` | Tiny column headers on dashboard rollups |
| **Micro label (alternate)** | `text-[9px] font-semibold leading-tight text-gray-500` | Slightly larger micro copy when `8px` is too tight |

### Controls (with semantic colors)

| Role | Classes | When |
|------|---------|------|
| **Primary button (dense)** | `text-xs font-semibold` + filled semantic button tokens + `text-white` | Default operational CTA (Refresh, Resume) |
| **Primary button (compact)** | `text-[11px] font-bold` + semantic fills | Modal footers, pricing row actions |
| **Secondary / outline** | `text-xs font-semibold` or `text-[11px] font-bold` + outline semantic tokens | View, Data Viewer, secondary paths |
| **Tertiary text button** | `text-[11px] font-semibold` + semantic `accentText` + `hover:underline` | Inline links in forms |

### Pills, badges, status chips

| Role | Classes | When |
|------|---------|------|
| **Pill (micro)** | `text-[9px] font-bold uppercase tracking-wider` + pill semantic/neutral colors | Tier tags, tiny state chips |
| **Pill (standard)** | `text-[10px] font-bold uppercase tracking-wider` | ALLOCATED, LITE, workflow stage on dense rows |
| **Pill (comfortable)** | `text-[11px] font-bold uppercase tracking-wider` | Modal footer badges, slightly larger chips |
| **Status count** | `text-[11px] font-bold tabular-nums` + status hue (`emerald-600`, `amber-600`, `rose-600`) | Numeric rollups in dashboard cells |

Do **not** use pill styles for primary actions — see [`theming.md`](./theming.md) interaction hierarchy.

### Data & monospace

| Role | Classes | When |
|------|---------|------|
| **Inline ID** | `font-mono text-[11px]` + `text-slate-700` or semantic accent | Run IDs, artifact IDs in debug lists |
| **Inline ID (micro)** | `font-mono text-[9px] text-gray-400` | Timestamp-adjacent IDs in widgets |
| **Document / JSON block** | `font-mono text-[11px] leading-relaxed whitespace-pre-wrap` + `text-slate-700` | Suggested wording, patch preview |
| **Document block (readable)** | `font-mono text-[13px] leading-relaxed whitespace-pre-wrap` + `text-slate-700` | Main revised-document reading pane |
| **Code in sentence** | `font-mono` + `text-[10px]` or `text-sm` inside prose | API path hints in error panels |
| **Dark code panel** | `font-mono text-[11px] leading-relaxed` on `bg-gray-900` | Raw JSON viewer |

**Selection treatment** on workflow document blocks: `selection:bg-indigo-100 selection:text-indigo-900`.

### Numbers & icons

| Role | Classes | When |
|------|---------|------|
| **Emphasized stat** | `text-[12px] font-black leading-none` | Icon-sized numeric emphasis in rollup tiles |
| **Tabular numbers** | `tabular-nums` on any aligned numeric column | Counts in dashboard cells |
| **Truncate** | `truncate` on single-line row titles | Dense list titles |

**Icons (lucide-react):** pair with text — commonly `14px` beside `text-[11px]`, `17–22px` beside `text-sm` / section titles. Stroke `2`–`2.25` on dense UI.

---

## 4. Marketing & auth type roles

Use on landing, pricing, signup, password flows, and similar public pages.

| Role | Classes | When |
|------|---------|------|
| **Hero title** | `text-3xl font-black text-gray-900 tracking-tight md:text-4xl` | Page H1 |
| **Section title** | `text-2xl font-bold text-gray-900 tracking-tight` or `md:text-3xl` | Major section H2 |
| **Lead paragraph** | `text-sm font-medium text-gray-700 leading-relaxed` | Subcopy under hero |
| **Form label** | `text-sm font-semibold text-gray-700` | Input labels |
| **Form control text** | `text-sm font-medium text-gray-900` | Inputs (inside field) |
| **Primary CTA** | `text-sm font-bold text-white` | Full-width or prominent buttons |
| **Fine print** | `text-xs font-semibold text-gray-600` | Footer links, helper lines |
| **Alert inline** | `text-sm font-semibold` + status border/background | Success/error form messages |

Marketing pages may still use **semantic colors** for story-specific blocks; default chrome stays neutral gray unless the copy refers to a workflow bucket (see [`theming.md`](./theming.md)).

---

## 5. Font weights

| Weight | Tailwind | Typical use |
|--------|----------|-------------|
| Black | `font-black` | Page titles, hero headings, dark-tooltip section titles |
| Extrabold | `font-extrabold` | Dense uppercase section headings in lists |
| Bold | `font-bold` | Buttons, pills, column headers, shell title |
| Semibold | `font-semibold` | Labels, secondary buttons, accordion headers, form labels (marketing) |
| Medium | `font-medium` | Body copy, tooltip body on dark backgrounds, form field text |
| Normal | `font-normal` | Rare; prefer medium in UI copy |

Avoid `font-light` / `font-thin` in product UI — contrast is too low on gray backgrounds.

---

## 6. Line height & letter-spacing

| Treatment | Tailwind | When |
|-----------|----------|------|
| Tight micro | `leading-tight` or `leading-snug` | `text-[8px]`–`text-[11px]` labels, rollups |
| Default body | `leading-snug` | Dense `text-[11px]` paragraphs |
| Comfortable body | `leading-relaxed` | Marketing copy, document blocks, help modals |
| Display tight | `tracking-tight` | `text-lg`+ headings (hero, section titles) |
| Label wide | `tracking-wide` | Uppercase `text-[10px]`–`text-[11px]` section labels |
| Label wider | `tracking-wider` or `tracking-widest` | Pills and eyebrows |

**Uppercase rule:** pair `uppercase` with `tracking-wide` (or wider) for legibility — never uppercase without added tracking on sizes below `text-sm`.

---

## 7. Text colors (neutral hierarchy)

Semantic **object** colors (indigo / emerald / fuchsia) come from [`theming.md`](./theming.md). Typography neutrals:

| Level | Typical class | Use |
|-------|---------------|-----|
| Primary | `text-gray-900` | Titles, primary row labels |
| Secondary | `text-gray-800` | Shell title, strong list labels |
| Body | `text-gray-700` | Marketing body, form emphasis |
| Muted | `text-gray-600` | Descriptions, metadata |
| Subtle | `text-gray-500` | Eyebrows, helpers, micro labels |
| Disabled | `text-gray-400` | Inactive micro copy, IDs in sidebar widgets |
| On dark | `text-slate-100` / `text-slate-300` | Tooltip body / section titles on `bg-slate-900` |

**Status hues** (not semantic buckets): `rose-*`, `amber-*`, `emerald-*` for error, warning, success **text** only — see external seed §7.

---

## 8. Decision guide

```
Is this signed-in operational UI?
├─ Yes → Use operational roles (§3); prefer text-[11px] for body in cards
│         Is it a page title? → text-2xl font-black
│         Is it a group heading? → uppercase 10–11px extrabold/bold
│         Is it a button? → text-xs font-semibold (or 11px font-bold in modals)
│         Is it an ID or code? → font-mono 11px (13px for reading pane)
└─ No (marketing/auth) → Use marketing roles (§4); text-sm+ for body
```

---

## 9. Do not

- Introduce a third custom font family without updating this doc.
- Use `text-base` (16px) as the default in **dense** operational lists — it breaks density; reserve for marketing or isolated empty states.
- Use `text-[8px]` outside dashboard micro-labels / rollups — minimum comfortable scan size is usually **10–11px**.
- Mix `font-bold` and `font-black` on the same screen level (pick one weight per heading tier).
- Use semantic indigo/emerald/fuchsia for **paragraph body** on white — color belongs on borders, pills, buttons, and short labels.

---

## 10. Maintainer sync

When adding a new recurring text style:

1. Add a row to §3 or §4 in this file.
2. Add an entry to `typography.tokens.json`.
3. If the external seed should know, add a one-line pointer in `external-build-ui-seed.md` §4.
