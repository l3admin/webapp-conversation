# Parzley button styles — portable definition

**Purpose:** Give an AI agent (or another app) an unambiguous contract for **primary** and **secondary** buttons, including the **soft-tinted menu rows** in the My Account dropdown.

**Machine-readable tokens:** [`button-styles.tokens.json`](./button-styles.tokens.json)  
**Color buckets:** [`semantic-themes.tokens.json`](./semantic-themes.tokens.json)  
**Typography sizes:** [`typography.tokens.json`](./typography.tokens.json)  
**In-repo source:** `utils/semanticThemes.ts`  
**Canonical menu example:** `components/UserContextWidget.tsx`

**How to use in Cursor:** `@docs/design-system/button-styles.md` and `@docs/design-system/button-styles.tokens.json` — implement these variants without inventing new button color systems.

---

## 1. Control hierarchy (pick one weight per action)

| Weight | Variant name | Visual | Typical labels |
|--------|--------------|--------|----------------|
| **Highest** | `filledPrimary` | Solid fill, white label | Continue, Start, Save, Generate, Resume, Use, Assign |
| **High (commerce)** | `commerceFilledPrimary` | Slate fill, white label | Buy, Checkout, Top up, Confirm purchase |
| **Medium** | `outlineSecondary` | White fill, colored border + text, light hover wash | View, Preview, Data Viewer, Open details |
| **Medium-low** | `softTintedSecondary` | Tinted passive fill, icon + label, deeper tint on hover | Account menu navigation rows |
| **Medium-low** | `neutralSoftSecondary` | Gray passive fill, no semantic bucket | Account & profile, generic settings |
| **Medium** | `destructiveSoft` | Red tinted fill | Clear session, reversible destructive menu items |
| **Low** | `ghost` | Transparent, colored text, hover wash | Tertiary toolbar actions |
| **Disabled** | (any variant + disabled tokens) | Slate gray, not-allowed cursor | Unavailable actions |

**Rules**

- One **filled primary** per card, row, or modal action group.
- Secondary controls must look visibly lighter than the primary on the same surface.
- Colors express **what kind of thing** the action relates to (workflow, user-owned, library, commerce) — not HTTP status or tier names.

---

## 2. Semantic color buckets

Map the feature to a bucket, then apply the variant tokens from that bucket.

| Bucket | Tailwind family | Use for |
|--------|-----------------|---------|
| `primaryWorkflow` | indigo | Active analysis, assessments, continue/run flows |
| `userAuthored` | emerald | Custom / BYO templates, user-created content, “buy credits” in account menu |
| `curatedLibrary` | fuchsia | Standards library, catalogue templates |
| `commerceNeutral` | slate | Checkout, top-up, billing |
| `neutral` | gray | Generic account/settings links |
| `destructive` | red | Logout-adjacent clear, destructive menu rows |

Do **not** use brand green (`#4C9B2D`), blue, violet, or sky for these buttons.

---

## 3. Size presets

All variants share: `inline-flex` / `flex`, `items-center`, `justify-center`, `transition-colors`. Icons: **lucide** stroke, `currentColor`, size per preset.

### Standard

Operational default — headers, cards, library toolbars.

- Padding: `px-3 py-1.5` (12px × 6px)
- Radius: `rounded-lg` (8px)
- Type: `text-xs font-semibold` (12px, weight 600)
- Gap: `gap-2` (8px)
- Icon: 14px

### Compact

Dense lists — e.g. Assessments **Resume** + **Data Viewer** pair.

- Padding: `px-2.5 py-1` or `px-2 py-1`
- Radius: `rounded-md` (6px)
- Type: `text-[10px] font-bold` (10px, weight 700)
- Gap: `gap-1` (4px)
- Icon: 14px
- Optional: `shadow-sm` on filled/outline compact pair

### Menu row

Full-width stacked links inside dropdowns (My Account menu).

- Width: `w-full`
- Padding: `py-2` (8px vertical; horizontal from content)
- Radius: `rounded-md`
- Type: `text-xs font-bold` (12px, weight 700)
- Gap: `gap-2`
- Icon: 14px, before label

### Toolbar compact

Revised Document and similar dense toolbars.

- Padding: `px-3 py-1.5`
- Radius: `rounded-md`
- Type: `text-[10px] font-bold uppercase tracking-widest`
- Border: always present (`border`); transparent on filled primary

---

## 4. Variant definitions

### 4.1 Filled primary (`filledPrimary`)

**Default**

- Background: bucket `filledButton` (e.g. `bg-indigo-600`)
- Text: `text-white`
- Border: `border-transparent` (compact workflow rows may use `border border-indigo-700` for extra edge definition)
- Shadow: `shadow-sm` optional on compact

**Hover**

- Background: bucket `filledButtonHover` (e.g. `hover:bg-indigo-700`)

**Disabled**

- `border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed`

**Hex reference (primary workflow):** fill `#4F46E5`, hover `#4338CA`

---

### 4.2 Outline secondary (`outlineSecondary`)

**Default**

- Background: `bg-white`
- Text: bucket `outlineButtonText` (e.g. `text-indigo-700`)
- Border: bucket `outlineButtonBorder` (e.g. `border-indigo-200`)
- Shadow: `shadow-sm` optional on compact

**Hover**

- Background: bucket `outlineButtonBgHover` (e.g. `hover:bg-indigo-50`)

**Disabled**

- Same as filled primary disabled tokens

---

### 4.3 Soft tinted secondary (`softTintedSecondary`)

This is the **account dropdown menu button** pattern: icon + label on a **passive tinted background**, not white.

**Default**

- Background: bucket `background` (e.g. `bg-indigo-50`)
- Text: bucket `accentText` (e.g. `text-indigo-700`)
- Border: bucket soft tint border — **`border-{family}-100`** (lighter than outline’s `-200`)

**Hover**

- Background: bucket `backgroundHover` (e.g. `hover:bg-indigo-100`)
- Text and border unchanged

**Size:** always `menuRow` preset unless explicitly full-width is not needed.

**Canonical examples (My Account dropdown)**

| Label | Bucket | Tailwind class string |
|-------|--------|----------------------|
| Assessment History | primaryWorkflow | `w-full py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors flex items-center justify-center gap-2 border border-indigo-100` |
| Standards Library | curatedLibrary | `w-full py-2 text-xs font-bold text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100 rounded-md transition-colors flex items-center justify-center gap-2 border border-fuchsia-100` |
| Buy More Credits | userAuthored | `w-full py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors flex items-center justify-center gap-2 border border-emerald-100` |

---

### 4.4 Neutral soft secondary (`neutralSoftSecondary`)

Generic menu links without a semantic workflow bucket.

**Default:** `text-gray-700 bg-gray-100`, no border  
**Hover:** `hover:bg-gray-200`  
**Example:** Account & profile — `w-full py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center justify-center gap-2`

---

### 4.5 Commerce filled primary (`commerceFilledPrimary`)

Billing and purchase CTAs only.

**Default:** `bg-slate-800 text-white`  
**Hover:** `hover:bg-slate-900`  
**Size:** usually `standard`

---

### 4.6 Destructive soft (`destructiveSoft`)

Reversible destructive actions in menus.

**Default:** `text-red-600 bg-red-50 border border-red-100`  
**Hover:** `hover:bg-red-100`, optional `hover:text-red-700`

---

### 4.7 Destructive icon-only (`destructiveIconOnly`)

Compact square control (e.g. logout beside user summary).

**Default:** `px-3 bg-red-50 text-red-600 border border-red-100 rounded-lg`  
**Hover:** `hover:bg-red-100 hover:text-red-700`  
**Icon:** 16px, centered, no label

---

### 4.8 Ghost (`ghost`)

Lowest emphasis in toolbars.

**Default:** `border-transparent`, bucket `outlineButtonText`  
**Hover:** bucket `outlineButtonBgHover`

---

## 5. Pairing patterns (copy these relationships)

### Assessments dense row

- **Primary:** `filledPrimary` + `compact` + `primaryWorkflow` — Resume  
- **Secondary:** `outlineSecondary` + `compact` + `primaryWorkflow` — Data Viewer  
- Same bucket; outline must read clearly lighter than filled.

### Account dropdown stack

Order (top to bottom):

1. User summary + `destructiveIconOnly` logout
2. `softTintedSecondary` × semantic destinations (indigo → fuchsia → emerald)
3. `neutralSoftSecondary` — Account & profile
4. `destructiveSoft` — Clear local session (when shown)

### Revised Document toolbar

- **Generate / primary workflow:** `filledPrimary` + `toolbarCompact` + `primaryWorkflow`
- **Secondary tools:** `outlineSecondary` + `toolbarCompact` + `primaryWorkflow`
- **Store (user-authored save):** `outlineSecondary` + `toolbarCompact` + `userAuthored` (emerald outline, not filled)

---

## 6. Implementation notes for any stack

**Tailwind:** Compose from `bucketResolvedStyles` + `variants` + `sizes` in `button-styles.tokens.json`. Join with a `themeCx`-style helper.

**Plain CSS:** Use `cssCustomPropertiesTemplate` in the JSON — set `--pz-btn-*` on a `[data-bucket="primaryWorkflow"]` wrapper, apply shared layout (flex, padding, radius, font-size), then variant classes for default/hover.

**React / Vue / etc.:** Model as `{ variant, bucket, size, disabled?, icon?, children }` and resolve to class string or style object from the JSON.

**HTML structure (menu row)**

```html
<a class="…menuRow softTinted primaryWorkflow…">
  <svg><!-- 14px icon --></svg>
  <span>Assessment History</span>
</a>
```

Icon before label; both centered as a group; full width of dropdown content area.

---

## 7. Anti-patterns

- Do not use `softTintedSecondary` for page-level primary CTAs — use `filledPrimary`.
- Do not use `filledPrimary` for every link in a dropdown — use `softTintedSecondary` or `neutralSoftSecondary`.
- Do not mix multiple semantic bucket colors on one button (e.g. indigo fill + fuchsia text).
- Do not default operational buttons to `text-base` — stay at `text-xs` / `text-[10px]` per size preset.
- Do not add hover border color jumps on soft-tinted rows; only background deepens.

---

## 8. Sync checklist (maintainers)

When button chrome changes in the app:

1. Update canonical component(s) — e.g. `UserContextWidget.tsx`, `LibraryFamilySection.tsx`, `revisedDocumentButtonStyles.ts`
2. Update `button-styles.tokens.json` (`composedExamples` + `bucketResolvedStyles`)
3. Update this file if hierarchy or pairing rules change
4. Keep `utils/semanticThemes.ts` and `semantic-themes.tokens.json` aligned for bucket colors
