## Overview

`SegmentedComponent` presents a small set of mutually exclusive options as a compact radio group and binds the consumer's selection through a two-way `value` model. It is a value-selection control, not a content-switching mechanism.

**Use Segmented when:**

- The user picks exactly one value from a small set, for example `List | Grid`, `Day | Week | Month`, or `Discover | My courses`.
- The choice changes the data displayed elsewhere, but each option does not own a separate content panel in the same widget.

**Prefer Tabs instead when:**

- Each option reveals its own content panel, for example `Account | Security | Notifications`. Use `TabsComponent` for that pattern — see [Segmented vs. Tabs](#segmented-vs-tabs).

## Import & Quick Start

```typescript
import { SegmentedComponent, SegmentedItemTemplateDirective } from "@nanahoshi/mona-ui/segmented";
import type { SegmentedOption } from "@nanahoshi/mona-ui/segmented";
```

```typescript
export type ViewMode = "list" | "grid";

protected readonly viewModes: SegmentedOption<ViewMode>[] = [
    { label: "List", value: "list" },
    { label: "Grid", value: "grid" }
];

protected viewMode: ViewMode | null = "list";
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

`value` is a two-way model. The consumer reads the current selection from it and writes to it to change the selection programmatically. When a programmatically supplied `value` matches no current option, no option is checked, and `value` stays as it is, so the application has to notice an option it removed.

To reject a choice, write the old value back after the current tick, for example once a confirmation resolves. A signal written and written back within one handler is the same value to Angular's binding, so the control never hears about it. Two options with the same `value` aren't supported; Angular warns about the duplicate `track` key in development.

```html
<p>Current mode: {{ viewMode }}</p>
```

## Examples

### Disabled options

`disabled` on `mona-segmented` disables every option at once. An option can also be disabled individually with its own `disabled` flag, even when the group is enabled.

```example
segmented/disabled
```

### With icons

A `monaSegmentedItemTemplate` replaces each option's label text. `option.label` stays the radio's accessible name, so the icons are hidden from assistive technology.

```example
segmented/with-icons
```

### In a form

```example
segmented/forms
```

## Appearance & Styling

### Full-width layout

The control is as wide as its options by default. Use the `class` input to give it a width, and with the default `alignment` the options share that width equally.

```html
<mona-segmented
    aria-label="Period"
    class="w-full"
    [options]="periods"
    [(value)]="period">
</mona-segmented>
```

### Alignment

`alignment` controls how options are positioned within the container. `"stretch"` (the default) makes every option fill equal width — the "Full-width layout" behavior above. `"start"`, `"center"`, and `"end"` size each option to its own content instead, positioning the group within the container. `"start"`/`"end"` are logical directions that follow the current text direction, so they flip automatically in RTL layouts.

| Value      | Behavior                                                          |
|------------|--------------------------------------------------------------------|
| `start`    | Content-sized options, positioned at the leading edge              |
| `center`   | Content-sized options, centered in the container                   |
| `end`      | Content-sized options, positioned at the trailing edge             |
| `stretch`  | Default. Every option fills equal width across the container       |

```html
<mona-segmented
    aria-label="Period"
    alignment="center"
    class="w-full"
    [options]="periods">
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
| `aria-labelledby` | The value of the `aria-labelledby` input, or the id of a `mona-label`       |
| `aria-disabled`   | `"true"` when the group is disabled; omitted otherwise                      |
| `aria-invalid`    | `"true"` when the control is both `touched` and `invalid`; omitted otherwise |
| `aria-readonly`   | `"true"` when `readonly`; omitted otherwise                                 |
| `aria-required`   | `"true"` when `required`; omitted otherwise                                 |

Each option renders a native `<input type="radio">` sharing the same `name`, so assistive technology announces the option label and its checked state automatically. A focused radio shows a solid outline around its option. In forced colors, which drop backgrounds, the selected option keeps a highlighted border.

Under `dir="rtl"`, options run from right to left and the arrows follow, and the indicator stays behind the selected option.

### Accessible name

Provide either `aria-label` or `aria-labelledby`. `aria-labelledby` takes precedence when both are supplied. A `mona-label` also names it. If none is provided, the radio group has no accessible name, which axe doesn't flag, so the component warns in development.

### Keyboard

Native radio behavior applies. Arrow keys move the selection within the group, and `Tab`/`Shift+Tab` moves focus between the group and the rest of the page. The entire group occupies a single Tab stop.

### Consumer responsibilities

- Provide an accessible name via `aria-label` or `aria-labelledby`.
- Keep option labels concise. Long labels crowd the group and overflow its container.
- `value` may be initialized to `null`, but no option will be checked until a matching option value is selected.

## Templates

Provide a `monaSegmentedItemTemplate` to replace the default label text with custom content, for example an icon paired with the label. `option.label` stays the radio's accessible name. Bind the options, as `[monaSegmentedItemTemplate]="viewModes"`, to type `let-option` from them.

| Directive                   | Overrides                | Rendered when   |
|------------------------------|---------------------------|-----------------|
| `monaSegmentedItemTemplate` | The default label text   | Every option    |

[With icons](#with-icons) shows one. When no template is projected, the option renders its plain `label` text, exactly as before.

### Template Context

The template receives a `SegmentedItemTemplateContext<T>`:

| Property             | Type                | Description                                             |
|-----------------------|---------------------|-----------------------------------------------------------|
| `$implicit` / `option` | `SegmentedOption<T>` | The option rendered by this item.                        |
| `index`               | `number`            | Zero-based option index.                                 |
| `selected`            | `boolean`           | Whether this option is currently selected.                |
| `disabled`            | `boolean`           | Whether this option is disabled, individually or via the group. |

The component still owns the radio input, selection, and disabled semantics; the template only supplies the visual content inside the label span.

## Forms Integration

`SegmentedComponent` implements the signal forms `FormValueControl<T | null>` interface, so it can be bound with `[formField]`, as in [In a form](#in-a-form).

When bound to a field, the `FormField` directive writes `invalid`, `touched`, `disabled`, `readonly`, `required` and `name` through the corresponding inputs and reads the selection from the `value` model.

It has no `ControlValueAccessor`, but `[(ngModel)]`, `[formControl]` and `formControlName` work too, because Angular binds a control's `value` and `touch` directly when it has no accessor.

<!-- verification-checklist
- [x] SegmentedComponent inputs/outputs/defaults verified against segmented.component.ts source (alignment, animate, ariaLabel, ariaLabelledBy, class, disabled, invalid, name, options, readonly, required, rounded, size, touched, value, touch)
- [x] alignment preset semantics verified against segmented.styles.ts segmentedContainerThemeVariants (justify-*) and segmentedOptionThemeVariants (flex-1 vs flex-none)
- [x] SegmentedValue and SegmentedOption exported types verified against models/SegmentedValue.ts and models/SegmentedOption.ts
- [x] Two-way value model behavior (no option checked when value matches nothing; null allowed initially) verified against segmented.component.ts's onOptionChange and value model declaration
- [x] ARIA table verified against host bindings in segmented.component.ts (role="radiogroup", aria-label, aria-labelledby, aria-disabled, aria-invalid)
- [x] Native radio keyboard semantics verified against template's <input type="radio"> with shared name
- [x] Options/labels/disabled per-option behavior verified against segmented.component.ts's optionDisabled computed and onOptionChange guard
- [x] size preset semantics verified against segmented.styles.ts segmentedOptionThemeVariants
- [x] rounded preset semantics verified against segmented.styles.ts segmentedContainerThemeVariants and segmentedOptionThemeVariants, with the focus ring inheriting the option radius
- [x] FormValueControl signal-forms integration verified against the `implements FormValueControl<T | null>` declaration and FormField-driven writes
- [x] Import paths use @nanahoshi/mona-ui/segmented per repo markdown convention
- [x] No internal computed signals, private methods, or Tailwind class names documented as public API
- [x] Inputs table sorted A→Z
- [x] Templates section verified against segmented-item-template.directive.ts (selector monaSegmentedItemTemplate) and SegmentedItemTemplateContext.ts ($implicit/option, index, selected, disabled)
-->
