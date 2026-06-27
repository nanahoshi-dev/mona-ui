## Overview

`ChipComponent` is a compact interactive label element used to represent filterable tags, toggleable options, or removable selections. It supports three content modes — a `label` input string, projected content via `<ng-content>`, or a mix of both with an optional prefix template — and three optional behaviors: toggle selection, removability, and plain click emission.

When `toggleable` is `true`, each activation flips the `selected` model. When `removable` is `true`, a remove button appears inside the chip. Both behaviors can be combined.

**Use the chip when you need to:**

- Display removable tags in a tag input or multiselect
- Represent filterable categories that the user can toggle on and off
- Show selectable option badges in a compact collection (skill tags, interest categories)
- Label entities with an optional avatar or icon prefix (contact chips)

**Do not use when:**

- A standalone action button is needed — use `<button monaButton>` instead
- Navigation to a URL is required — the chip does not support anchor semantics

## Import & Basic Usage

```typescript
import { ChipComponent } from "@mirei/mona-ui";
// Optional: only needed when adding a prefix template
import { ChipPrefixTemplateDirective } from "@mirei/mona-ui";
```

Add the imported symbols to your standalone component's `imports` array.

**Display chip:**

```html
<mona-chip label="Angular"></mona-chip>
```

**Toggleable chip:**

```html
<mona-chip label="TypeScript" [toggleable]="true" [(selected)]="isSelected"></mona-chip>
```

**Removable chip:**

```html
<mona-chip label="Remove me" [removable]="true" (remove)="onRemove($event)"></mona-chip>
```

**Projected content:**

```html
<mona-chip>
    <svg lucideTag [size]="12"></svg>
    Draft
</mona-chip>
```

When `label` is non-empty it takes precedence over projected content — both are not visible at the same time.

**Prefix template — avatar chip:**

```html
<mona-chip label="Jane Smith">
    <ng-template monaChipPrefixTemplate>
        <mona-avatar image="photo.jpg" alt="" [width]="16" [height]="16" borderRadius="50%" [borderWidth]="0">
        </mona-avatar>
    </ng-template>
</mona-chip>
```

The prefix template renders before the label or projected content. It receives no template context.

> **Keyboard access:** Chips receive `tabindex="0"` automatically when `toggleable` or `removable` is `true`. For a chip that emits `contentClick` without either flag, set `[tabindex]="0"` explicitly so it can be reached by keyboard.

## Appearance & Styling

### Look variants

| `look`      | Appearance                                        |
|-------------|---------------------------------------------------|
| `default`   | Background with border; adapts to the active theme |
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

| `rounded` | Shape                          |
|-----------|--------------------------------|
| `none`    | No rounding                    |
| `small`   | Slight rounding                |
| `medium`  | Moderate rounding              |
| `large`   | Strong rounding                |
| `full`    | Pill / fully rounded (default) |

### Selected state

Each `look` value applies a distinct selected appearance when `selected` is `true` — typically a shifted background tone. Selected styles are applied automatically; no additional configuration is required.

### Custom classes

```html
<mona-chip label="Tag" class="font-bold tracking-wide"></mona-chip>
```

Classes passed via `class` are merged with variant classes using `tailwind-merge`.

## Accessibility Notes

The following attributes are managed automatically on the host element:

| Attribute       | When present                                        | Value                                |
|-----------------|-----------------------------------------------------|--------------------------------------|
| `aria-label`    | `ariaLabel` input (`aria-label`) is non-empty       | Value of the `aria-label` input      |
| `aria-label`    | `aria-label` is empty and `label` is non-empty      | Value of the `label` input           |
| `aria-checked`  | `toggleable` is `true`                              | `"true"` or `"false"`                |
| `aria-disabled` | `disabled` is `true`                                | `"true"`                             |
| `role`          | `toggleable` is `true`                              | `"checkbox"`                         |
| `tabindex`      | Always                                              | `0` when interactive, `-1` otherwise |

**Remove button:** When `removable` is `true`, the remove button inside the chip has an automatically computed accessible label: `"Remove, <label>"` using the `label` input, or `"Remove, item"` when no `label` is set. Override this with the `removeLabel` input.

Keyboard activation (Enter and Space) fires when the chip host has focus. When keyboard focus moves inside the chip to the remove button, Enter and Space activate only the remove button — the chip body is not also activated. Space prevents the default page scroll behavior.

**Consumer responsibilities:**

- When the chip displays only projected content (no `label` input), the host has no accessible name unless `aria-label` is provided. Set `[aria-label]` in that case.
- When `removable` is `true` and no `label` is set, provide `[removeLabel]` so the remove button carries a meaningful accessible label.
- For icon-only or purely visual chips, set `[aria-label]` to describe what the chip represents.

## API

### `ChipComponent`

**Selector:** `mona-chip`

**Content projection:** default slot for chip body content; use `<ng-template monaChipPrefixTemplate>` for prefix content rendered before the label.

#### Inputs

| Name           | Type                                                                                                              | Default     | Description |
|----------------|-------------------------------------------------------------------------------------------------------------------|-------------|-------------|
| `aria-label`   | `string`                                                                                                          | `""`        | Accessible name for the host element. Describe what the chip represents. When empty, assistive technology announces the role without a label. Falls back to the `label` input value when not set. |
| `class`        | `string`                                                                                                          | `""`        | Additional CSS classes merged onto the host element via `tailwind-merge`. |
| `disabled`     | `boolean`                                                                                                         | `false`     | Renders the chip with reduced visual emphasis and removes pointer interaction. |
| `label`        | `string`                                                                                                          | `""`        | Text label displayed inside the chip. When non-empty, takes precedence over projected content. Also used as the fallback accessible name and as part of the remove button's accessible label. |
| `look`         | `'default' \| 'error' \| 'ghost' \| 'info' \| 'outline' \| 'primary' \| 'secondary' \| 'success' \| 'warning'`  | `'default'` | Visual style variant controlling the chip's background color, border, and interaction states. |
| `removable`    | `boolean`                                                                                                         | `false`     | Renders a remove button inside the chip. When activated, emits the `remove` output. |
| `removeLabel`  | `string`                                                                                                          | —           | Accessible label for the remove button, overriding the auto-computed `"Remove, <label>"` fallback. Use when the chip shows only projected content and the default label is not descriptive enough. |
| `rounded`      | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'`                                                             | `'full'`    | Border-radius preset applied to the chip. |
| `selected`     | `boolean`                                                                                                         | `false`     | Two-way bindable selected state. When `toggleable` is `true`, each activation flips this value. Use `[(selected)]` for two-way binding. |
| `size`         | `'small' \| 'medium' \| 'large'`                                                                                  | `'medium'`  | Size preset controlling the chip's padding and remove button dimensions. |
| `tabindex`     | `number \| string`                                                                                                | —           | Tab index override. When not set, computed automatically: `0` when `toggleable` or `removable` is `true`, `-1` otherwise. Overridden to `-1` when `disabled` is `true`. |
| `toggleable`   | `boolean`                                                                                                         | `false`     | Enables toggle behavior. When `true`, each activation flips `selected` and the host receives `role="checkbox"` with `aria-checked`. |
| `value`        | `unknown`                                                                                                         | —           | Arbitrary value associated with this chip. Useful for identifying which chip was selected or removed in a collection. |

#### Outputs

| Name           | Type    | Description |
|----------------|---------|-------------|
| `contentClick` | `void`  | Emitted when the chip body is clicked or activated via Enter or Space. Not emitted when the remove button is activated. |
| `remove`       | `Event` | Emitted when the remove button is clicked. Only fires when `removable` is `true`. Emits the originating `Event`. |

---

### `ChipPrefixTemplateDirective`

**Selector:** `ng-template[monaChipPrefixTemplate]`

Apply to an `<ng-template>` directly inside `<mona-chip>` to render prefix content (e.g., an avatar or icon) before the chip label or projected content. The template receives no context.

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
- [x] removeLabel input added to API table (new input added in this session)
- [x] Inputs sorted A→Z: aria-label, class, disabled, label, look, removable, removeLabel, rounded, selected, size, tabindex, toggleable, value
- [x] Outputs sorted A→Z: contentClick, remove
- [x] selected correctly documented as two-way bindable (model)
- [x] tabindex default documented as computed (undefined input, automatic -1/0 logic)
- [x] contentClick clarified: not emitted from remove button
- [x] ariaLabel input alias confirmed as aria-label in chip.component.ts
- [x] removeLabel and value defaults are — (undefined, no default in source)
- [x] Accessibility claims verified against source: role/aria-checked/aria-disabled/aria-label/tabindex host bindings confirmed in chip.component.ts; remove button aria-label confirmed in template
- [x] Keyboard guard fix confirmed: button[data-chip-remove] selector; remove button keyboard activation does not trigger chip body
- [x] Basic examples compile against the public API surface
- [x] No internal or unexported APIs exposed
- [x] ChipPrefixTemplateDirective documented with selector and no-inputs note
- [x] intro.md trimmed to title + selector + one sentence, matching button/avatar/breadcrumb pattern
-->
