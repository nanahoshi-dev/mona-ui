## Overview

`SegmentedComponent` presents a small set of mutually exclusive options as a compact radio group and binds the consumer's selection through a two-way `value` model. It is a value-selection control, not a content-switching mechanism.

**Use Segmented when:**

- The user picks exactly one value from a small set, for example `List | Grid`, `Day | Week | Month`, or `Discover | My courses`.
- The choice changes the data displayed elsewhere, but each option does not own a separate content panel in the same widget.

**Prefer Tabs instead when:**

- Each option reveals its own content panel, for example `Account | Security | Notifications`. Use `TabsComponent` for that pattern — see [Segmented vs. Tabs](#segmented-vs-tabs).

## Import & Quick Start

```typescript
import { SegmentedComponent } from "@nanahoshi/mona-ui/segmented";
```

```typescript
export type ViewMode = "list" | "grid";

protected readonly viewModes: SegmentedOption<ViewMode>[] = [
    { label: "List", value: "list" },
    { label: "Grid", value: "grid" }
];

protected viewMode: ViewMode = "list";
```

```html
<mona-segmented
    aria-label="View mode"
    [options]="viewModes"
    [(value)]="viewMode">
</mona-segmented>
```

`options` is required and drives both the visible labels and the selected values. The component renders each option as a native radio input sharing one `name`, so exactly one option is selected at a time.

### Two-way value binding

`value` is a two-way model. The consumer reads the current selection from it and writes to it to change the selection programmatically. When a programmatically supplied `value` matches no current option, no option is checked.

```html
<p>Current mode: {{ viewMode }}</p>
```

## Feature Examples

### Disabled group

`disabled` on `mona-segmented` disables every option at once. An option can also be disabled individually with its own `disabled` flag, even when the group is enabled.

```html
<mona-segmented
    aria-label="Sort order"
    [options]="sortOptions"
    [disabled]="isReadOnly()">
</mona-segmented>
```

```typescript
protected readonly sortOptions: SegmentedOption<string>[] = [
    { label: "Newest", value: "newest" },
    { label: "Popular", value: "popular" },
    { label: "Archived", value: "archived", disabled: true }
];
```

### Full-width layout

The control stretches to its container by default. Use the `class` input to apply layout utilities such as a constrained width.

```html
<mona-segmented
    aria-label="Period"
    class="w-72"
    [options]="periods"
    [(value)]="period">
</mona-segmented>
```

### Sizes

`size` controls the height, horizontal padding, text size, and spacing of each option.

| Value    | Use                                    |
|----------|----------------------------------------|
| `small`  | Compact toolbars and tight layouts     |
| `medium` | Default; standard form controls        |
| `large`  | Prominent, touch-friendly controls     |

```html
<mona-segmented aria-label="Period" size="small" [options]="periods"></mona-segmented>
```

### Roundness

`rounded` controls the border radius of the container and its options.

| Value    | Appearance              |
|----------|-------------------------|
| `none`   | Square corners          |
| `small`  | Slightly rounded        |
| `medium` | Default rounded style   |
| `large`  | Pronounced rounding     |
| `full`   | Pill-shaped             |

```html
<mona-segmented
    aria-label="Period"
    rounded="full"
    [options]="periods">
</mona-segmented>
```

## Segmented vs. Tabs

| Concern                 | Segmented                                                                  | Tabs                                                                          |
|-------------------------|----------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| Selection model         | Exactly one value, bound via `[(value)]`                                   | One active tab; panels switch automatically                                   |
| Content                 | Options have no content; the value is read by the consumer                 | Each tab owns a content panel rendered inside `<mona-tabs>`                   |
| Semantic role           | `radiogroup` with native radio inputs                                      | `tablist` / `tab` / `tabpanel` pattern                                        |
| Typical use             | `List | Grid`, `Day | Week | Month`, `Discover | My courses`               | `Account | Security | Notifications`                                          |
| Routing                 | Not a routing mechanism                                                    | Not a routing mechanism                                                       |

Tabs convey "one of several content panels is active"; Segmented conveys "one of several values is selected."

## Accessibility Notes

### ARIA

`SegmentedComponent` manages the following attributes on its host:

| Attribute         | Value                                                                       |
|-------------------|-----------------------------------------------------------------------------|
| `role`            | `"radiogroup"`                                                              |
| `aria-label`      | The value of the `aria-label` input, when provided                           |
| `aria-labelledby` | The value of the `aria-labelledby` input, when provided                     |
| `aria-disabled`   | `"true"` when the group is disabled; omitted otherwise                      |
| `aria-invalid`    | `"true"` when the control is both `touched` and `invalid`; `null` otherwise |

Each option renders a native `<input type="radio">` sharing the same `name`, so assistive technology announces the option label and its checked state automatically. A focused radio receives a visible focus ring.

### Accessible name

Provide either `aria-label` or `aria-labelledby`. `aria-labelledby` takes precedence when both are supplied. If neither is provided, the radio group has no accessible name — supply one to satisfy the AXE `aria-required-children` checks.

### Keyboard

Native radio behavior applies. Arrow keys move the selection within the group, and `Tab`/`Shift+Tab` moves focus between the group and the rest of the page. The entire group occupies a single Tab stop.

### Consumer responsibilities

- Provide an accessible name via `aria-label` or `aria-labelledby`.
- Keep option labels concise. Long labels crowd the group and overflow its container.
- `value` may be initialized to `null`, but no option will be checked until a matching option value is selected.

## API

### `SegmentedComponent`

**Selector:** `mona-segmented`

**Generic:** `SegmentedComponent<T extends SegmentedValue = SegmentedValue>` where `SegmentedValue = string | number`.

#### Inputs

| Name             | Type                                                       | Default    | Description                                                                                                                                                                                                 |
|------------------|------------------------------------------------------------|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `aria-label`     | `string \| null`                                           | `null`     | Accessible name for the radio group. Provide either `aria-label` or `aria-labelledby`.                                                                                                                      |
| `aria-labelledby`| `string \| null`                                           | `null`     | ID of an external element that provides the accessible name for the radio group.                                                                                                                            |
| `class`          | `string`                                                   | `""`       | Additional CSS classes merged onto the host element via `tailwind-merge`.                                                                                                                                   |
| `disabled`       | `boolean`                                                  | `false`    | Disables every option in the group and prevents value changes.                                                                                                                                              |
| `invalid`        | `boolean`                                                  | `false`    | Marks the component as invalid. Error styling requires both `invalid` and `touched` to be `true`. When bound to a signal form field via `[formField]`, this is written by the signal forms `Field` directive. |
| `options`        | `readonly SegmentedOption<T>[]`                            | —          | **Required.** The list of selectable options. Exactly one option is selected at a time.                                                                                                                     |
| `rounded`        | `"none" \| "small" \| "medium" \| "large" \| "full"`   | `"medium"` | Border-radius preset applied to the segmented container and its options.                                                                                                                                   |
| `size`           | `"small" \| "medium" \| "large"`                           | `"medium"` | Size preset controlling the height, horizontal padding, text size, and spacing of each option.                                                                                                              |
| `touched`        | `boolean`                                                  | `false`    | Marks the component as touched. When bound to a signal form field via `[formField]`, this is written by the signal forms `Field` directive.                                                                  |
| `value`          | `T \| null`                                                | `null`     | Two-way bindable. The currently selected value. When it matches no current option, no option is checked. A `null` value is allowed initially but cannot be restored through segmented interaction.           |

#### Outputs

| Name    | Type       | Description                                                                      |
|---------|------------|----------------------------------------------------------------------------------|
| `touch` | `void`     | Emitted when the selected value changes or focus leaves a radio input.           |

---

### Exported types

| Type               | Description                                                                  |
|--------------------|------------------------------------------------------------------------------|
| `SegmentedValue`   | `string \| number` — the value domain of every `SegmentedOption`.             |
| `SegmentedOption<T>` | `{ readonly label: string; readonly value: T; readonly disabled?: boolean }` — a single selectable option. `label` is the visible text; `value` is the value written to the `value` model; `disabled` optionally disables this option. |

```typescript
import type { SegmentedOption, SegmentedValue } from "@nanahoshi/mona-ui/segmented";
```

---

## Forms Integration

`SegmentedComponent` implements the signal forms `FormValueControl<T | null>` interface, so it can be bound with `[formField]`:

```html
<mona-segmented
    [formField]="viewModeField"
    [options]="viewModes">
</mona-segmented>
```

```typescript
protected readonly viewModeField = new Field<ViewMode | null>(null);
```

When bound to a `Field`, the `Field` directive writes `invalid` and `touched` through the corresponding inputs and reads the selection from the `value` model.

---

<!-- verification-checklist
- [x] SegmentedComponent inputs/outputs/defaults verified against segmented.component.ts source and cross-checked against component-metadata.json's SegmentedComponent entry (ariaLabel, ariaLabelledBy, class, disabled, invalid, options, rounded, size, touched, value, touch)
- [x] SegmentedValue and SegmentedOption exported types verified against models/SegmentedValue.ts and models/SegmentedOption.ts
- [x] Two-way value model behavior (no option checked when value matches nothing; null allowed initially) verified against segmented.component.ts's onOptionChange and value model declaration
- [x] ARIA table verified against host bindings in segmented.component.ts (role="radiogroup", aria-label, aria-labelledby, aria-disabled, aria-invalid)
- [x] Native radio keyboard semantics verified against template's <input type="radio"> with shared name
- [x] Options/labels/disabled per-option behavior verified against segmented.component.ts's optionDisabled computed and onOptionChange guard
- [x] size preset semantics verified against segmented.styles.ts segmentedOptionThemeVariants
- [x] rounded preset semantics verified against segmented.styles.ts segmentedContainerThemeVariants and segmentedOptionThemeVariants, with the focus ring inheriting the option radius
- [x] FormValueControl signal-forms integration verified against the `implements FormValueControl<T | null>` declaration and Field-driven invalid/touched writes
- [x] Import paths use @nanahoshi/mona-ui/segmented per repo markdown convention
- [x] No internal computed signals, private methods, or Tailwind class names documented as public API
- [x] Inputs table sorted A→Z
-->
