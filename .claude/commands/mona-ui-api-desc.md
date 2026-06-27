---
description: Update JSDoc @description and @default on all public inputs, models, and outputs of a Mona UI component. Use when the user invokes /mona-ui-api-desc with a component name (e.g. /mona-ui-api-desc button, /mona-ui-api-desc progress-bar). Also use when the user asks to update, improve, or standardize JSDoc descriptions on a component's public API.
---

You are working in the `mona-ui` repository.

Your task is to update the `@description` and `@default` JSDoc tags on all public `input()`, `model()`, and `output()` members of the requested Mona UI component.

Component to update:
`$ARGUMENTS`

---

## Goals

1. Every public `input()`, `model()`, and `output()` must have a `@description` tag.
2. Every `input()` and `model()` must have a `@default` tag reflecting its actual default value.
3. Descriptions must be **consumer-facing**, **concise** (1–2 sentences maximum), and **free of implementation details**.
4. Inputs that appear in multiple components must use the **canonical vocabulary** defined below so descriptions are consistent across the library.

---

## Process

**Step 1** — Locate the component source file under `projects/mona-ui/src/lib/`.

**Step 2** — Read the file and list every public `input()`, `model()`, and `output()` member.

**Step 3** — For each member:
- Check if a `@description` exists and is accurate.
- Check if a `@default` exists and matches the actual default value in the `input()` / `model()` call.
- Cross-reference the **Canonical Vocabulary** table below. If the input name matches, use or adapt the canonical description.
- If the input is component-specific, write a new concise description.

**Step 4** — Apply only the changes needed. Do not rewrite descriptions that are already accurate and consistent.

**Step 5** — Do not modify any private, protected, or internal members.

---

## Canonical Vocabulary

Use these descriptions verbatim or adapt them minimally when the input name matches. Do not invent different wording for the same concept across components.

### Appearance & Layout

| Input name | Canonical `@description` |
|---|---|
| `rounded` | Border-radius preset applied to the component. |
| `size` | Size preset controlling the component's dimensions. |
| `orientation` | Layout orientation of the component. |
| `class` / `userClass` | Additional CSS classes merged onto the host element via `tailwind-merge`. |

### Color & Theming

| Input name | Canonical `@description` |
|---|---|
| `color` | Accent color. Pass a CSS color string, or a function receiving the current percentage (0–100) and returning a string. When empty, falls back to the primary theme color. |
| `fillColor` | Fill color applied to the component's primary visual element. |
| `trackColor` | Color of the unfilled track behind the progress indicator. |

### State

| Input name | Canonical `@description` |
|---|---|
| `disabled` | Renders the component with reduced visual emphasis and removes pointer interaction. |
| `readonly` | Prevents value changes while preserving the component's visual state. |
| `loading` | Displays a loading indicator and prevents interaction while an operation is in progress. |
| `indeterminate` | Activates indeterminate mode when the completion value is unknown. |
| `animate` | Enables CSS transitions on state changes. Set to `false` when updating values at high frequency. |
| `checked` | Whether the control is checked. |
| `selected` | Whether the item is selected. |
| `expanded` | Whether the item or panel is expanded. |
| `open` | Whether the overlay or panel is open. |
| `active` | Whether the item is in an active state. |

### Value & Range

| Input name | Canonical `@description` |
|---|---|
| `value` | Current value. Values outside `[min, max]` are clamped before rendering; non-finite values are treated as `0`. |
| `min` | Lower bound of the value range. |
| `max` | Upper bound of the value range. Must be greater than `min`. |
| `step` | Increment applied when the value changes via keyboard or controls. |
| `precision` | Number of decimal places applied to the displayed value. |

### Label & Content

| Input name | Canonical `@description` |
|---|---|
| `label` | Text label displayed alongside the component. |
| `labelPosition` | Position of the label relative to the component. |
| `labelVisible` | Controls label visibility. |
| `labelStyles` | Inline styles applied to the default label element. Has no effect when a custom label template is provided. |
| `placeholder` | Placeholder text shown when no value is selected or entered. |
| `title` | Title text displayed in the component header or trigger. |
| `text` | Primary text content displayed by the component. |
| `icon` | Icon displayed alongside the component's content. |

### Accessibility

| Input name / alias | Canonical `@description` |
|---|---|
| `aria-label` | Accessible name for the host element. Describe what the component represents. When empty, assistive technology announces the role without a label. |
| `aria-labelledby` | ID of an external element that provides the accessible name for the host element. |
| `aria-describedby` | ID of an element that provides an extended description for the host element. |
| `aria-valuetext` | Human-readable override for the `aria-valuenow` announcement. Useful in indeterminate mode — set to a localized string such as `"Loading"`. |

### Data & Templates

| Input name | Canonical `@description` |
|---|---|
| `data` | Collection of items to render. |
| `items` | Collection of items to render. |
| `options` | Collection of options available for selection. |
| `textField` | Property name or accessor used to derive the display text from a data item. |
| `valueField` | Property name or accessor used to derive the value from a data item. |
| `itemTemplate` | Custom template for rendering individual items. |
| `headerTemplate` | Custom template for the component header. |
| `footerTemplate` | Custom template for the component footer. |

### Behavior

| Input name | Canonical `@description` |
|---|---|
| `filterable` | Enables client-side filtering of the item list. |
| `clearable` | Shows a clear button that resets the value to empty. |
| `multiple` | Allows multiple items to be selected simultaneously. |
| `virtual` | Enables virtual scrolling for large item collections. |
| `pageSize` | Number of items rendered per page in virtual mode. |
| `delay` | Debounce delay in milliseconds applied to value or filter changes. |

---

## Description Writing Rules

1. **Start with a verb** for inputs that control a feature: "Enables…", "Renders…", "Controls…", "Sets…", "Displays…".
2. **Start with a noun** for inputs that supply data: "Accent color…", "Current value…", "Collection of items…".
3. **Do not start with the input name** (e.g., avoid "disabled controls whether the component is disabled").
4. **Do not say "Whether the component is [X]"** for most boolean inputs — say what the true state *does* instead.
5. **Do not mention implementation details**: no Tailwind class names, no internal signal names, no DOM selectors, no CVA variant names.
6. **Do not exceed two sentences.** If more context is needed, the documentation page is the right place.
7. **For `output()` members**: use past-tense event language — "Emitted when the value changes.", "Emitted when the panel opens.". Include the emitted value type in the description if not obvious from the type annotation.

---

## Hard Rules

- Do not rename inputs, models, or outputs.
- Do not change default values — only document the existing default accurately.
- Do not modify private, protected, or internal members.
- Do not add `@description` to members that are not public `input()`, `model()`, or `output()` calls.
- Use the `@description` tag (not plain prose before `@default`) because the metadata extractor depends on it.
- Do not reformat the file beyond the JSDoc blocks being updated.
