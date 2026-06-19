# Parzley Semantic Theming System

**Portable seed for other apps / Cursor builds:** [`external-build-ui-seed.md`](./external-build-ui-seed.md), [`semantic-themes.tokens.json`](./semantic-themes.tokens.json), [`typography.md`](./typography.md), [`typography.tokens.json`](./typography.tokens.json).

**Typography (sizes, weights, treatments):** [`typography.md`](./typography.md).

## Purpose

This document defines the canonical semantic theming system for the Parzley application.

The goal of this system is to:
- standardize visual meaning across the product,
- create consistent workflow/object identity,
- reduce ad hoc Tailwind color usage,
- separate workflow semantics from status semantics,
- and establish a scalable design language.

This document is the human-readable source of truth for:
- semantic object colors,
- workflow theming,
- interaction hierarchy,
- and UI color meaning.

All new UI work must follow this document.

---

# Core Principle

Colors in Parzley should represent:
- object identity,
- workflow context,
- and semantic meaning.

Colors should NOT primarily represent:
- monetization state,
- entitlement state,
- implementation details,
- or arbitrary component styling.

---

# Semantic Theme Categories

The application currently defines three primary semantic object/workflow categories:

| Semantic Type | Purpose |
|---|---|
| Analysis Workflow | Active operational assessments and lifecycle progression |
| Custom Standards | User-created/editable standards |
| Catalogue Standards | System-provided/library standards |

These categories must remain visually distinct and semantically consistent.

---

# 1. Analysis Workflow Theme

## Meaning

The Analysis Workflow theme represents:
- active operational work,
- lifecycle progression,
- findings,
- recommendations,
- revised documents,
- QA validation,
- and in-progress workflows.

This is the dominant operational color system in the application.

---

## Color Family

Use:
- Indigo family

This replaces previous inconsistent usage of:
- blue,
- violet,
- mixed analyzer colors.

All analysis workflow surfaces should standardize on indigo.

---

## Semantic Intent

Indigo communicates:
- active workflow,
- intelligence,
- operational progression,
- system activity,
- structured processing.

---

## Recommended Tailwind Tokens

| Usage | Tailwind |
|---|---|
| Border | border-indigo-200 |
| Hover Border | hover:border-indigo-300 |
| Background | bg-indigo-50 |
| Hover Background | hover:bg-indigo-100 |
| Accent Text | text-indigo-700 |
| Strong Accent Text | text-indigo-900 |
| Filled Button | bg-indigo-600 |
| Filled Button Hover | hover:bg-indigo-700 |
| Outline Button Border | border-indigo-200 |
| Outline Button Text | text-indigo-700 |
| Pills | bg-indigo-100 text-indigo-800 |

---

# 2. Custom Standards Theme

## Meaning

The Custom Standards theme represents:
- user-created standards,
- editable standards,
- BYO standards,
- authored content,
- in-progress standards.

These are user-owned assets.

---

## Color Family

Use:
- Emerald family

This theme communicates:
- authored content,
- ownership,
- editable assets,
- user-generated workflows.

---

## Semantic Intent

Emerald communicates:
- creation,
- ownership,
- customization,
- editable structure.

---

## Recommended Tailwind Tokens

| Usage | Tailwind |
|---|---|
| Border | border-emerald-200 |
| Hover Border | hover:border-emerald-300 |
| Background | bg-emerald-50 |
| Hover Background | hover:bg-emerald-100 |
| Accent Text | text-emerald-700 |
| Strong Accent Text | text-emerald-900 |
| Filled Button | bg-emerald-600 |
| Filled Button Hover | hover:bg-emerald-700 |
| Outline Button Border | border-emerald-200 |
| Outline Button Text | text-emerald-700 |
| Pills | bg-emerald-100 text-emerald-800 |

---

# 3. Catalogue Standards Theme

## Meaning

The Catalogue Standards theme represents:
- system-provided standards,
- official standards,
- library standards,
- stable reference frameworks.

These are NOT editable user-authored assets.

They should feel:
- trusted,
- curated,
- authoritative,
- stable.

---

## Color Family

Use:
- **Fuchsia** family (implementation in `utils/semanticThemes.ts`)

Do NOT use:
- plain gray as the sole catalogue identity,
- workflow indigo,
- emerald (reserved for custom / BYO).

The goal is clear visual distinction from:
- active workflows,
- user-authored assets,
- and neutral UI scaffolding.

---

## Semantic Intent

Fuchsia communicates:
- trusted reference material,
- official library assets,
- curated frameworks,
- stable reusable standards.

---

## Recommended Tailwind Tokens

| Usage | Tailwind |
|---|---|
| Border | border-fuchsia-200 |
| Hover Border | hover:border-fuchsia-300 |
| Background | bg-fuchsia-50 |
| Hover Background | hover:bg-fuchsia-100 |
| Accent Text | text-fuchsia-700 |
| Strong Accent Text | text-fuchsia-900 |
| Filled Button | bg-fuchsia-600 |
| Filled Button Hover | hover:bg-fuchsia-700 |
| Outline Button Border | border-fuchsia-200 |
| Outline Button Text | text-fuchsia-700 |
| Pills | bg-fuchsia-100 text-fuchsia-800 |

---

# Brand Color

Parzley brand green remains:

```text
#4C9B2D
```

This color is reserved for:
- branding,
- logo surfaces,
- marketing surfaces,
- primary product identity.

It should NOT be reused as:
- workflow theming,
- semantic object identity,
- or status semantics.

---

# Interaction Hierarchy

The application uses three interaction emphasis levels.

---

# 1. Filled Buttons

Purpose:
- primary workflow actions,
- progression actions,
- highest-emphasis actions.

Examples:
- Start Analysis
- Continue
- Use
- Generate

Characteristics:
- solid fill,
- strongest visual weight,
- semantic theme color background.

---

# 2. Outline Buttons

Purpose:
- secondary actions,
- utility interactions,
- lower emphasis actions.

Examples:
- View
- Edit
- Preview

Characteristics:
- white/light background,
- colored border,
- colored text,
- lighter visual weight.

These should visually contrast against:
- filled CTA buttons,
- pills/badges.

---

# 3. Pills / Badges

Purpose:
- metadata,
- object labels,
- state indicators,
- categorization.

Examples:
- CUSTOM
- LIBRARY
- ALLOCATED
- LITE

Characteristics:
- compact,
- low-emphasis,
- informational only.

Pills should NOT visually compete with:
- action buttons,
- workflow controls.

---

# Lifecycle Visualization

Lifecycle stages should inherit the parent object theme.

Example:
- analysis lifecycle stages use indigo accents,
- custom standard lifecycle stages use emerald accents.

Do NOT introduce new colors for lifecycle stages unless semantically necessary.

---

# Commercial / Access States

Commercial states such as:
- Lite,
- Full,
- Premium,
- Included,
- Assigned

should NOT define major layout color systems.

Use:
- subtle pills,
- lightweight badges,
- small metadata labels.

Commercial states are secondary metadata, not semantic object identity.

---

# Global Neutral System

Continue using the existing neutral system:
- gray-50
- gray-100
- gray-200
- gray-600
- gray-800
- white surfaces

Neutral surfaces should remain:
- lightweight,
- restrained,
- readable,
- unobtrusive.

Semantic colors should sit on top of this neutral foundation.

---

# Important Rules

## Do

- Use semantic object themes consistently.
- Use centralized semantic theme tokens.
- Keep semantic meaning stable across the app.
- Use lifecycle theming consistently.
- Preserve interaction hierarchy.

---

## Do Not

- Hardcode random Tailwind color families.
- Mix blue and indigo for the same workflow type.
- Use semantic workflow colors for status/error messaging.
- Use commercial state colors as primary layout identity.
- Introduce new object colors without updating this document.

---

# Implementation module (`utils/semanticThemes.ts`)

The TypeScript module implements the three themes in this document:

- `analysisWorkflowTheme` — indigo
- `customStandardTheme` — emerald
- `catalogueStandardTheme` — fuchsia

Exports:

- `semanticThemes` — registry object
- `getSemanticTheme(key)` — typed lookup
- `themeCx(...)` — concatenate class tokens safely
- `analysisWorkflowBrandHex` — `#4F46E5` / `#4338ca` for inline styles and legacy `AgentTheme.primary` / `secondary` (must stay aligned with indigo-600 / indigo-700)

**Extensions beyond the token tables above** (layout/helpers only; same color families):

| Field | Purpose |
| --- | --- |
| `backgroundMuted` | Lighter panel wash, e.g. `bg-*-50/40` |
| `accentTextMuted` | Secondary accent, often `text-*-600` |
| `outlineButtonBgHover` | Outline control hover wash |
| `ringSubtle` | `ring-1 ring-*-100` for selected nav tiles |

`theme.ts` (`themeColors.requirementsBuilder`) should stay in lockstep with `analysisWorkflowTheme` for Tailwind class strings.

---

# Migration decisions (workspace dashboard — interim)

Until the dashboard redesign:

- **Split hub (option C):** **Activity / analysis runs** accents use **Analysis Workflow (indigo)**. **Templates / catalogue / library** accents use **Catalogue Standards (fuchsia)**. **Custom / BYO** accents use **Custom Standards (emerald)**.
- **Commerce** (Top up, purchase access): **slate/neutral** shells — not workflow semantic colors.
- **Standards Library** links on dashboard rows: **fuchsia** (catalogue), not violet.

## Standards Library page (`/requirements-library`) — Phase 3

- **Catalogue** sections (allocated browse, premium browse, free catalogue rows, filters for premium catalog + family): **fuchsia** shells, pills, and primary actions (**Use** / **Assign** / account-setup **Select**).
- **BYO / custom** section: **emerald** unchanged; primary **Use** stays emerald.
- **Tier filter (Lite / Full):** **neutral gray** only — no fuchsia/indigo/sky tier identity (subtle metadata).
- **Commerce** (**Upgrade**, **Top Up**, **Purchase** on this page): **slate** fills.
- **Open in Document Analyzer** after assign success: **indigo** (analysis workflow handoff), not catalogue fuchsia.

## Assessments library + Data Viewer (Phase 4)

- **Assessments list (`/app/assessments`) — operational queue (May 2026 refresh):** **`LibraryFamilySection`** uses **slate** + `Library` for **catalog** standard identity on this dense list surface; **amber** + `Wand2` for **custom** (distinct from Standards Library BYO **emerald** so “catalogue vs custom row” reads as neutral official vs warm authored). Workflow stage pills + **Resume** use **`analysisWorkflowTheme`** (indigo); **Data Viewer** is outline indigo.
- **Codified standard** column inside an expanded run: **`LibraryArtifactRows`** `master_template` rows follow the same **slate / amber** split on Assessments (`density="compact"`).
- **Standard source** + custom-only inputs on Assessments: **amber** (same custom row story).
- **Target document** row chrome: **indigo** (run / analysis context).
- **Line-item analysis**, **recommendations**, and **final merged document** rows: unified **analysis workflow indigo** (no sky / violet / catalogue-fuchsia on outputs).
- **Primary run CTA** (Resume / Continue / Open assessment): **indigo** filled (`analysisWorkflowTheme`), not violet.
- **Assessment Detail** revised-document / remediation panels: **indigo** instead of violet; stray **sky** / **blue** status chips mapped to **indigo**.

## Diagnostics / Session Brain / Knowledge (Phase 5)

- **Session Brain** and **KnowledgeView** tooling (endpoint tester, suite modals, data-ops actions): **slate** neutrals — not workflow indigo/fuchsia/emerald except where a row is explicitly an analyzer artifact.
- **Knowledge** source badges: **Standards Benchmarker** → **fuchsia** (catalogue); **System Event** → **slate** (neutral); **Policy Auditor** stays **indigo**; **Best Practice** stays **emerald**.
- **SessionBrainDataOpsPanel** primary destructive/ops-style control: **slate** (replacing violet).

## Migration status (May 2026)

Phases **1–5** for in-app semantic surfaces are **implemented** (dashboard shell, Document Analyzer, Standards Library, Assessments / Data Viewer library, diagnostics). Remaining drift is **expected** on marketing pages, legacy welcome tiles, auth callouts, and third-party-style components — clean up opportunistically or via a scheduled `rg` audit (`violet-|sky-|purple-|blue-[456]` outside status semantics).

### Residual drift audit (snapshot, `.tsx` / `.ts`)

| Bucket | Where | Typical tokens | Direction |
| --- | --- | --- | --- |
| Marketing / public | `LandingPage`, `BuildYourOwnPage`, `DocumentAuditorTemplate`, `PrivacyPolicyAboutToolPage`, `StandardsAlignmentPage`, `YourDataPage` | `blue-*`, links | Prefer **neutral slate/gray** for generic marketing; use **indigo / fuchsia / emerald** only when the block is explicitly an analyzer, catalogue, or BYO story. |
| Commerce / pricing | `PricingPage` | `violet-*` vs `emerald-*` tabs | Future pass: align SKUs to **slate** (commerce) + **fuchsia** (catalogue track) + **emerald** (BYO track) per `theming.md` commerce rule. |
| Auth / onboarding | `AuthForms`, `InitialAccessModal`, `AccountSetupPage` | `blue-*` info panels | **Slate** for generic info; **indigo** only if copy is analyzer-specific. |
| Shell widgets | `ChatHeader` (domain `purple`, plan `sky`), `UserContextWidget`, `LoadingWidget` (construction `purple`) | `purple-*`, `sky-*` | Normalize when editing those files. |
| Welcome / schema | `DefaultSchemaWelcome`, `StandardsAlignmentWelcome` | `blue-*`, `sky-*` | Map to **indigo** (analysis) or **fuchsia** (standards library) by meaning. |
| Checkout | `CheckoutPrepPage` | `sky-*` shell | **Fuchsia** if the card is catalogue-facing; else **slate**. |
| Diagnostics UI | `LoginPage` (token debug), `SessionDebugModal`, `InferredContextWidget`, `QuickStartFileModal` | `blue-*` | **Slate** or **indigo** for tool/debug (match Session Brain). |
| Raw analysis chips | `components/requirements/rawAnalysis/rawAnalysisUtils.ts` | `bg-blue-600` | **Indigo-600** when that file is next touched. |
| Modal info | `ConfirmationModal` (`info` → blue) | `blue-*` | **Slate** or **indigo** for non-destructive info. |

### Reference PR pattern (for reviewers)

When changing colors in a PR:

1. **Name the semantic bucket** for each region (analysis / catalogue / custom / commerce / neutral diagnostic).
2. **Touch at most one “hero” example per bucket** if the PR is theme-only (e.g. one analyzer panel + one catalogue card + one BYO card) so reviewers can compare side-by-side.
3. **Import or mirror** `utils/semanticThemes.ts` tokens (`themeCx`, `*Theme`) instead of inventing new Tailwind families.
4. **Commerce** (pricing, Top up, generic purchase): **slate**, not violet/indigo “brand” fills.
5. In the PR description, add one line: **“No new semantic colors; aligns with `docs/design-system/theming.md`.”**

---

# Current Standardization Goals

## Required Cleanup

- Standardize all analysis workflows to indigo.
- Remove mixed analyzer blue/indigo usage.
- Preserve emerald for custom standards only.
- Catalogue standards use **fuchsia** (aligned with `catalogueStandardTheme`).
- Reduce hardcoded Tailwind color drift.
- Centralize semantic object theming.

---

# Future Direction

This document is intended to evolve into the canonical semantic design system for:
- workflow objects,
- lifecycle stages,
- artifact categories,
- and operational UI states across the Parzley platform.