## Overview

`ChipComponent` is a compact, interactive label element. It supports three content modes — a `label` input string, projected content via `<ng-content>`, or a mix of both with a prefix template — and three optional behaviors: toggle selection, removability, and plain click emission.

When `toggleable` is `true`, each activation flips the `selected` model and the host receives `role="checkbox"` with `aria-checked`. When `removable` is `true`, a remove button appears inside the chip with its own accessible label. Both behaviors can be combined.

**Use `ChipComponent` when you need to:**

- Display removable tags in a tag input or multiselect
- Represent filterable categories that can be toggled on or off
- Show selectable options in a compact collection (skill badges, interest tags)
- Identify entities with an optional avatar prefix (contact chips)

**Do not use `ChipComponent` when:**

- A standalone action button is needed — use `<button monaButton>` instead
- Navigating to a URL — `ChipComponent` does not support anchor semantics

## Import & Basic Usage

```typescript
import { ChipComponent } from "@mirei/mona-ui";
// Optional: only needed when adding a prefix template
import { ChipPrefixTemplateDirective } from "@mirei/mona-ui";
```

Add the imported symbols to your standalone component's `imports` array.

**Display chip (label only):**

```html
<mona-chip label="Angular"></mona-chip>
```

**Toggleable chip:**

```html
<mona-chip label="TypeScript" [toggleable]="true" [(selected)]="isSelected"></mona-chip>
```

When `toggleable` is `true`, the chip receives `role="checkbox"` and `aria-checked`, and each activation flips `selected`.

**Removable chip:**

```html
<mona-chip label="Remove me" [removable]="true" (remove)="onRemove($event)"></mona-chip>
```

The remove button has an automatically generated accessible label: `"Remove, <label>"`. When only projected content is used (no `label` input), the accessible label falls back to `"Remove, item"` — provide `ariaLabel` on the chip in that case.

**Prefix template — avatar chip:**

```html
<mona-chip label="Jane Smith">
    <ng-template monaChipPrefixTemplate>
        <mona-avatar image="photo.jpg" alt="" [width]="16" [height]="16" borderRadius="50%" [borderWidth]="0">
        </mona-avatar>
    </ng-template>
</mona-chip>
```

The prefix template renders before the label or projected content inside the chip.

**Projected content:**

```html
<mona-chip>
    <svg lucideTag [size]="12"></svg>
    Draft
</mona-chip>
```

When `label` is non-empty it takes precedence over projected content — both cannot be visible at the same time.

> **Keyboard access:** Chips are keyboard-accessible (`tabindex="0"`) only when `toggleable` or `removable` is `true`. For a purely display chip that emits `contentClick`, set `[tabindex]="0"` explicitly so it can be reached by keyboard.

## Appearance & Styling

### Look variants

`look` defaults to `"default"`. All variants have a distinct selected-state appearance:

| `look`      | Base appearance                                   |
|-------------|---------------------------------------------------|
| `default`   | Background + border, theme-aware                  |
| `outline`   | Transparent background with border                |
| `primary`   | Filled primary color                              |
| `secondary` | Filled secondary color                            |
| `success`   | Filled success color                              |
| `error`     | Filled error color                                |
| `warning`   | Filled warning color                              |
| `info`      | Filled info color                                 |
| `ghost`     | No background or border; hover reveals background |

### Sizes

| `size`   | Description                |
|----------|----------------------------|
| `small`  | Compact padding            |
| `medium` | Standard padding (default) |
| `large`  | Generous padding           |

The remove button dimensions scale automatically with `size`.

### Rounded presets

`rounded` defaults to `"full"` (pill shape):

| `rounded` | Shape                         |
|-----------|-------------------------------|
| `none`    | No rounding                   |
| `small`   | Slight rounding               |
| `medium`  | Moderate rounding             |
| `large`   | Strong rounding               |
| `full`    | Pill / fully rounded (default)|

### Selected state

Each `look` value applies a distinct selected appearance when `selected` is `true` — typically a shifted background tone that indicates active state. Selected styles are applied automatically; no additional configuration is required.

### Custom classes

```html
<mona-chip label="Tag" class="text-xs font-bold"></mona-chip>
```

## Accessibility Notes

The chip manages the following ARIA attributes on its host element:

- `aria-label` — set to the `ariaLabel` input when provided; falls back to the `label` input; absent when neither is set.
- `role="checkbox"` and `aria-checked` — applied only when `toggleable` is `true`. `aria-checked` reflects the current `selected` value.
- `aria-disabled="true"` — applied when `disabled` is `true`.

The remove button (when `removable` is `true`) carries an automatically computed accessible label: `"Remove, <label>"`, or `"Remove, item"` when no `label` input is set. When using removable chips with projected content only, set the `ariaLabel` input on the chip host so context is available.

Keyboard activation (Enter and Space) works when the chip is interactive (`toggleable` or `removable` is `true`). Space prevents the default page scroll behavior. A non-interactive display chip (neither toggleable nor removable) has `tabindex="-1"` by default and cannot be reached by keyboard — set `[tabindex]="0"` explicitly to make it keyboard-accessible.

## API

### `ChipComponent`

**Selector:** `mona-chip`

**Content projection:** default slot for chip body content; use `<ng-template monaChipPrefixTemplate>` for prefix content rendered before the label.

#### Inputs

| Name         | Type                                                                                                             | Default     | Description |
|--------------|------------------------------------------------------------------------------------------------------------------|-------------|-------------|
| `ariaLabel`  | `string`                                                                                                         | —           | Accessible label for the chip host element. When set, takes precedence over the `label` input for the host's accessible name. |
| `class`      | `string`                                                                                                         | `''`        | Additional CSS classes merged onto the host element via `tailwind-merge`. |
| `disabled`   | `boolean`                                                                                                        | `false`     | When `true`, the chip becomes non-interactive and shows at reduced opacity. Sets `aria-disabled="true"`. Overrides `tabindex` to `-1`. |
| `label`      | `string`                                                                                                         | `''`        | Text displayed inside the chip. When non-empty, replaces projected content. Also used as the fallback accessible name and as part of the remove button's accessible label. |
| `look`       | `'default' \| 'error' \| 'ghost' \| 'info' \| 'outline' \| 'primary' \| 'secondary' \| 'success' \| 'warning'` | `'default'` | Visual variant. All values support a distinct selected-state appearance. |
| `removable`  | `boolean`                                                                                                        | `false`     | When `true`, renders a remove button with accessible label `"Remove, <label>"` (or `"Remove, item"` when no `label` is set). |
| `rounded`    | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'`                                                            | `'full'`    | Border-radius preset. Defaults to `'full'` (pill shape). |
| `selected`   | `boolean`                                                                                                        | `false`     | Two-way bindable selected state. When `toggleable` is `true`, each activation flips this value. Use `[(selected)]` for two-way binding. |
| `size`       | `'small' \| 'medium' \| 'large'`                                                                                 | `'medium'`  | Size preset controlling padding and remove button dimensions. |
| `tabindex`   | `number \| string`                                                                                               | —           | Tab index override. When not set, computed automatically: `0` when `toggleable` or `removable` is `true`, `-1` otherwise. Overridden to `-1` when `disabled` is `true`. |
| `toggleable` | `boolean`                                                                                                        | `false`     | When `true`, activating the chip flips `selected`. The host receives `role="checkbox"` and `aria-checked`. |
| `value`      | `unknown`                                                                                                        | —           | Arbitrary value associated with this chip. Useful for identifying which chip was selected or removed in a collection. |

#### Outputs

| Name           | Type    | Description |
|----------------|---------|-------------|
| `contentClick` | `void`  | Emitted when the chip body is clicked or activated via Enter or Space. Fires regardless of whether `toggleable` is set. Not emitted when the remove button is activated. |
| `remove`       | `Event` | Emitted when the remove button is clicked. `stopPropagation()` is called before emitting, so `contentClick` is not also fired. Only relevant when `removable` is `true`. |

---

### `ChipPrefixTemplateDirective`

**Selector:** `ng-template[monaChipPrefixTemplate]`

Apply to an `<ng-template>` directly inside `<mona-chip>` to render prefix content (e.g., an avatar or icon) before the chip label. The template receives no context.

```html
<mona-chip label="Jane Smith">
    <ng-template monaChipPrefixTemplate>
        <mona-avatar image="photo.jpg" alt="" [width]="16" [height]="16" borderRadius="50%" [borderWidth]="0">
        </mona-avatar>
    </ng-template>
</mona-chip>
```

`ChipPrefixTemplateDirective` has no inputs or outputs.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source (chip.component.ts) and component-metadata.json
- [x] API table split into Inputs / Outputs; Kind and Required columns removed
- [x] Inputs sorted A→Z: ariaLabel, class, disabled, label, look, removable, rounded, selected, size, tabindex, toggleable, value
- [x] Outputs sorted A→Z: contentClick, remove
- [x] selected correctly documented as Two-way bindable (model)
- [x] tabindex default documented as computed (undefined input, automatic -1/0 logic)
- [x] contentClick clarified: fires regardless of toggleable state
- [x] ariaLabel type confirmed as string | undefined (input<string>() with no default)
- [x] Tailwind class names removed from Sizes table (was ps-1/pe-1/py-0.5 etc.) — replaced with consumer-facing descriptions
- [x] Tailwind class names removed from Rounded presets table (was rounded-sm/md/lg) — replaced with consumer-facing descriptions
- [x] Internal compound class names removed from Selected state section (was bg-selected, bg-primary-selected etc.)
- [x] Accessibility claims verified against source and spec: role/aria-checked/aria-disabled/aria-label/tabindex host bindings confirmed in chip.component.ts; remove button aria-label confirmed in template
- [x] Stale package name TODO removed
- [x] Basic examples compile against the public API surface
- [x] No internal or unexported APIs exposed
-->

<!-- TODO(owner-review): When removable=true and only projected content (no label), remove button says "Remove, item" — consider a dedicated removeLabel input for this case -->
