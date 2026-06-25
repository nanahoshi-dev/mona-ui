## Overview

`FieldsetComponent` renders a styled native `<fieldset>` element. The component provides Mona UI theming for the border and legend notch without replacing the underlying HTML semantics — screen readers still announce the legend as the accessible group label for all form controls projected inside.

The legend is hidden entirely when neither `legend` nor `monaFieldsetLegendTemplate` is provided, avoiding an empty `<legend>` element in the DOM.

**Use `FieldsetComponent` when you need to:**

- Group related form controls (inputs, checkboxes, radios) under a shared visible label
- Communicate to assistive technology that a set of fields belongs together
- Add a bordered, themed container around a form section

**Do not use `FieldsetComponent` when:**

- The grouping is purely visual with no form controls — a plain `<div>` or a card component is more appropriate; `<fieldset>` carries form semantics AT will announce

## Import & Basic Usage

```typescript
import { FieldsetComponent } from "@mirei/mona-ui";
```

Add `FieldsetComponent` to your standalone component's `imports` array.

**Basic usage with a string legend:**

```html
<mona-fieldset legend="Personal information">
    <div class="p-4 flex flex-col gap-3">
        <input monaTextBox placeholder="First name" aria-label="First name" />
        <input monaTextBox placeholder="Last name" aria-label="Last name" />
    </div>
</mona-fieldset>
```

**Custom legend template** — replace the string legend with any content:

```html
<mona-fieldset>
    <ng-template monaFieldsetLegendTemplate>
        <span class="font-semibold text-primary">Billing address</span>
    </ng-template>
    <div class="p-4">
        <!-- form controls -->
    </div>
</mona-fieldset>
```

> **Accessibility note:** Always provide either `legend` or `monaFieldsetLegendTemplate`. A `<fieldset>` without a `<legend>` has no accessible group name and offers no benefit over a plain `<div>`.

## Appearance & Styling

### Rounded presets

| `rounded` | Shape                  |
|-----------|------------------------|
| `none`    | Square corners         |
| `small`   | `rounded-sm`           |
| `medium`  | `rounded-md` (default) |
| `large`   | `rounded-lg`           |
| `full`    | `rounded-full`         |

The `rounded` value applies to both the fieldset border and the legend notch, keeping them visually aligned.

### Legend styling

When a plain `legend` string is supplied, the legend notch is styled with `bg-background-dark`, a border, and padding. When `monaFieldsetLegendTemplate` is used, no default styling is applied to the `<legend>` element — the consumer controls the appearance entirely.

### Custom class

Pass additional classes via the `class` attribute; they are merged onto the host element via `tailwind-merge`:

```html
<mona-fieldset legend="Preferences" class="w-full max-w-md"></mona-fieldset>
```

## API

### `FieldsetComponent`

**Selector:** `mona-fieldset`

| Name      | Kind  | Type                                                    | Default    | Required | Description |
|-----------|-------|---------------------------------------------------------|------------|----------|-------------|
| `class`   | input | `string`                                                | `''`       | Optional | Additional CSS classes merged onto the host element via `tailwind-merge`. |
| `legend`  | input | `string`                                                | `''`       | Optional | Text displayed in the legend notch. Ignored when `monaFieldsetLegendTemplate` is provided. When both are empty, no `<legend>` element is rendered. |
| `rounded` | input | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'`   | `'medium'` | Optional | Border-radius preset applied to both the fieldset border and the legend notch. |

`FieldsetComponent` has no model inputs and no event outputs.

### `FieldsetLegendTemplateDirective`

**Selector:** `ng-template[monaFieldsetLegendTemplate]`

Replaces the string `legend` with projected content inside the `<legend>` element. When this template is present, no default legend styling is applied — the consumer is responsible for all visual treatment. The template has no context variables.

```typescript
import { FieldsetComponent, FieldsetLegendTemplateDirective } from "@mirei/mona-ui";
```

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] standalone: true removed from FieldsetLegendTemplateDirective
- [x] *ngTemplateOutlet replaced with [ngTemplateOutlet] property binding
- [x] @description and @default added to userClass; @default added to legend
- [x] legendVisible computed logic verified — hides <legend> when both legend and template are absent
- [x] No internal or unexported APIs exposed
-->
