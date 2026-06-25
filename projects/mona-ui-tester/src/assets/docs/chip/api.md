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

`look` defaults to `"default"`. All variants have distinct selected-state compound classes:

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

| `size`   | Padding                        |
|----------|--------------------------------|
| `small`  | `ps-1 pe-1 py-0.5`             |
| `medium` | `ps-1.5 pe-1.5 py-1` (default) |
| `large`  | `ps-2 pe-2 py-1.5`             |

### Rounded presets

`rounded` defaults to `"full"` (pill shape):

| `rounded` | Shape          |
|-----------|----------------|
| `none`    | No rounding    |
| `small`   | `rounded-sm`   |
| `medium`  | `rounded-md`   |
| `large`   | `rounded-lg`   |
| `full`    | Pill (default) |

### Selected state

Each `look` value has a distinct selected compound class (e.g., `bg-selected` for `default`, `bg-primary-selected` for `primary`). Selected styles are applied automatically when `selected` is `true`.

### Custom classes

```html

<mona-chip label="Tag" class="text-xs font-bold"></mona-chip>
```

## API

### `ChipComponent`

**Selector:** `mona-chip`

**Content projection:** default slot for chip body content; use `<ng-template monaChipPrefixTemplate>` for prefix content.

| Name           | Kind   | Type                                                                                                           | Default     | Required | Description                                                                                                                                                                |
|----------------|--------|----------------------------------------------------------------------------------------------------------------|-------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ariaLabel`    | input  | `string`                                                                                                       | —           | Optional | Accessible label for the chip host element. When set, takes precedence over the `label` input for the accessible name.                                                     |
| `class`        | input  | `string`                                                                                                       | `''`        | Optional | Additional CSS classes merged onto the host element via `tailwind-merge`.                                                                                                  |
| `contentClick` | output | `void`                                                                                                         | —           | Optional | Emitted when the chip body is clicked or activated via Enter or Space. Not emitted when the remove button is activated.                                                    |
| `disabled`     | input  | `boolean`                                                                                                      | `false`     | Optional | When `true`, the chip becomes non-interactive (`pointer-events-none`) and shows at half opacity.                                                                           |
| `label`        | input  | `string`                                                                                                       | `''`        | Optional | Text displayed inside the chip. When non-empty, replaces projected content. Also used as the accessible name fallback and as part of the remove button's accessible label. |
| `look`         | input  | `'default' \| 'error' \| 'ghost' \| 'info' \| 'outline' \| 'primary' \| 'secondary' \| 'success' \| 'warning'` | `'default'` | Optional | Visual variant. All values support a distinct selected state.                                                                                                              |
| `removable`    | input  | `boolean`                                                                                                      | `false`     | Optional | When `true`, renders a remove button with accessible label `"Remove, <label>"`.                                                                                            |
| `remove`       | output | `Event`                                                                                                        | —           | Optional | Emitted when the remove button is clicked. `stopPropagation()` is called before emitting, so `contentClick` is not also fired.                                             |
| `rounded`      | input  | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'`                                                           | `'full'`    | Optional | Border-radius preset. Defaults to `'full'` (pill shape).                                                                                                                   |
| `selected`     | model  | `boolean`                                                                                                      | `false`     | Optional | Selected state. When `toggleable` is `true`, each activation flips this value. Two-way bindable with `[(selected)]`.                                                       |
| `size`         | input  | `'small' \| 'medium' \| 'large'`                                                                               | `'medium'`  | Optional | Size preset controlling padding and remove button dimensions.                                                                                                              |
| `tabindex`     | input  | `number \| string`                                                                                             | —           | Optional | Tab index override. When not set, computed automatically: `0` when `toggleable` or `removable` is `true`, `-1` otherwise.                                                  |
| `toggleable`   | input  | `boolean`                                                                                                      | `false`     | Optional | When `true`, activating the chip flips `selected`. The host receives `role="checkbox"` and `aria-checked`.                                                                 |
| `value`        | input  | `unknown`                                                                                                      | —           | Optional | Arbitrary value associated with this chip. Useful for identifying which chip was removed or selected in a collection.                                                      |

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
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] ariaChecked bug fixed: gated on toggleable() — non-toggleable chips no longer get aria-checked
- [x] userClass @description added; remove output JSDoc cleaned up
- [x] selected correctly marked as model (kind: "model" in metadata)
- [x] tabindex default documented as computed (undefined input, automatic logic)
- [x] Basic examples compile against the public API surface
- [x] No internal or unexported APIs exposed
-->

<!-- TODO(owner-review): Confirm public package name is @mirei/mona-ui vs mona-ui -->
<!-- TODO(owner-review): When removable=true and only projected content (no label), remove button says "Remove, item" — consider a dedicated removeLabel input for this case -->
