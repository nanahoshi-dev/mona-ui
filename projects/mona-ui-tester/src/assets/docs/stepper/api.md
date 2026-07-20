## Overview

Use the Stepper when a task must be completed in a defined series of stages — a checkout flow, a configuration wizard, an onboarding sequence. The component enforces ordering rules, tracks the active step, and communicates progress through a built-in progress bar.

**Linear mode** (default) constrains navigation: the user can only move to the step immediately before or after the current one. **Non-linear mode** lets users jump to any step freely. Individual steps can also be permanently disabled regardless of the current mode.

## Import & Quick Start

```typescript
import { StepperComponent } from "@nanahoshi/mona-ui";
import type { StepOptions } from "@nanahoshi/mona-ui";
```

Add `StepperComponent` to your standalone component's `imports` array.

```typescript
protected readonly steps: StepOptions[] = [
    { label: "Account" },
    { label: "Profile" },
    { label: "Review" }
];

protected currentStep = 0;
```

```html
<mona-stepper [steps]="steps" [(step)]="currentStep"></mona-stepper>
```

## Anatomy & Structural Templates

Each step renders an **indicator** (the numbered circle) and a **label** (the text below or beside it). Three `ng-template` directives let you replace either part, or replace the entire step unit:

| Directive                           | Selector                                    | Replaces                                      |
| ----------------------------------- | ------------------------------------------- | --------------------------------------------- |
| `StepperIndicatorTemplateDirective` | `ng-template[monaStepperIndicatorTemplate]` | Content inside the indicator circle           |
| `StepperLabelTemplateDirective`     | `ng-template[monaStepperLabelTemplate]`     | The step label text                           |
| `StepperStepTemplateDirective`      | `ng-template[monaStepperStepTemplate]`      | The entire step unit (indicator + label area) |

All three directives expose the same typed context (`StepperTemplateContext<T>`):

| Variable                 | Type             | Description                                                 |
| ------------------------ | ---------------- | ----------------------------------------------------------- |
| `$implicit` (`let-step`) | `StepOptions<T>` | The step's options object                                   |
| `active`                 | `boolean`        | True when this step's index ≤ the current active step index |
| `currentIndex`           | `number`         | Zero-based index of the currently active step               |
| `disabled`               | `boolean`        | Whether this step is disabled                               |
| `index`                  | `number`         | Zero-based index of this step                               |

Import all three alongside the component:

```typescript
import {
    StepperComponent,
    StepperIndicatorTemplateDirective,
    StepperLabelTemplateDirective,
    StepperStepTemplateDirective
} from "@nanahoshi/mona-ui";
```

### Indicator template

Replaces only the icon or number inside the indicator circle. The circle element and its ARIA attributes are preserved.

```html
<mona-stepper [steps]="steps" [(step)]="currentStep">
    <ng-template monaStepperIndicatorTemplate let-step let-index="index" let-currentIndex="currentIndex">
        @if (index < currentIndex) {
        <svg lucideCheck [size]="16"></svg>
        } @else { {{ index + 1 }} }
    </ng-template>
</mona-stepper>
```

### Label template

Replaces the label span rendered beneath (horizontal) or beside (vertical) the indicator.

```html
<mona-stepper [steps]="steps" [(step)]="currentStep">
    <ng-template monaStepperLabelTemplate let-step let-active="active">
        <span [class.font-bold]="active">{{ step.label }}</span>
    </ng-template>
</mona-stepper>
```

### Step template

Replaces the entire visual step unit. The component wraps the projected content in a `role="button"` element that preserves keyboard navigation and ARIA semantics.

```html
<mona-stepper [steps]="steps" [(step)]="currentStep">
    <ng-template monaStepperStepTemplate let-step let-active="active">
        <span class="text-3xl" [class.text-primary]="active"> {{ active ? "●" : "○" }} </span>
    </ng-template>
</mona-stepper>
```

## Feature Examples

### Non-linear mode

```html
<mona-stepper [steps]="steps" [(step)]="currentStep" [linear]="false"></mona-stepper>
```

### Disabled steps

Set `disabled: true` on individual steps to permanently block activation regardless of linear mode. Disabled steps are skipped during keyboard arrow navigation.

```typescript
protected readonly steps: StepOptions[] = [
    { label: "Account" },
    { label: "Suspended", disabled: true },
    { label: "Review" }
];
```

### Vertical orientation

```html
<mona-stepper [steps]="steps" [(step)]="currentStep" orientation="vertical"></mona-stepper>
```

In vertical mode, `ArrowUp` and `ArrowDown` replace `ArrowLeft` and `ArrowRight`. Set a fixed height on the host or a containing element.

### Rounded presets

| `rounded` | Shape              |
| --------- | ------------------ |
| `none`    | Square corners     |
| `small`   | Slightly rounded   |
| `medium`  | Moderately rounded |
| `large`   | Generously rounded |
| `full`    | Circular (default) |

### Attaching data to steps

`StepOptions.data` accepts any value and is available in all template contexts as `step.data`.

```typescript
protected readonly steps: StepOptions<{ icon: string }>[] = [
    { label: "Cart",    data: { icon: "shopping-cart" } },
    { label: "Payment", data: { icon: "credit-card" }  }
];
```

## Keyboard & Accessibility

### Keyboard map

| Key                                                | Action                          |
| -------------------------------------------------- | ------------------------------- |
| `ArrowLeft` (horizontal) / `ArrowUp` (vertical)    | Move highlight to previous step |
| `ArrowRight` (horizontal) / `ArrowDown` (vertical) | Move highlight to next step     |
| `Home`                                             | Move highlight to first step    |
| `End`                                              | Move highlight to last step     |
| `Enter` / `Space`                                  | Activate the highlighted step   |

Arrow key movement respects linear mode (limits range) and disabled steps (skips them). The stepper uses a **roving tabindex** pattern — only the highlighted step has `tabindex="0"`.

### ARIA attributes

| Attribute                         | Element                    | When                             | Value                                                 |
| --------------------------------- | -------------------------- | -------------------------------- | ----------------------------------------------------- |
| `role="group"`                    | Host                       | Always                           | —                                                     |
| `aria-label`                      | Host                       | Always                           | `aria-label` input (default `"Progress"`)             |
| `role="button"`                   | Each step indicator        | Always                           | —                                                     |
| `aria-label`                      | Each step indicator        | Always                           | Step's `label` string                                 |
| `aria-current="step"`             | Active step indicator      | When this step is active         | `"step"`                                              |
| `aria-disabled="true"`            | Locked/disabled indicator  | When locked (linear) or disabled | `true`                                                |
| `tabindex="0"`                    | Highlighted step indicator | When highlighted                 | `0`                                                   |
| `tabindex="-1"`                   | All other indicators       | Otherwise                        | `-1`                                                  |
| `role="presentation"`             | Each `<li>`                | Always                           | —                                                     |
| `role="progressbar"`              | Progress track             | Always                           | —                                                     |
| `aria-valuenow`                   | Progress track             | Always                           | Current step index                                    |
| `aria-valuemin` / `aria-valuemax` | Progress track             | Always                           | `0` / total steps minus one                           |
| `aria-label`                      | Progress track             | Always                           | `progressAriaLabel` input (default `"Step progress"`) |

**Consumer responsibilities:**

- Provide a meaningful `aria-label` when context does not already identify the stepper's purpose.
- Provide a localized `progressAriaLabel` for non-English applications.
- All `label` fields in `StepOptions` are required and become the accessible name for each indicator.

## API

### `StepperComponent`

**Selector:** `mona-stepper`

#### Inputs

| Name                | Type                                                 | Default           | Description                                                                                                     |
| ------------------- | ---------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `aria-label`        | `string`                                             | `"Progress"`      | Accessible label for the stepper group (`role="group"`).                                                        |
| `linear`            | `boolean`                                            | `true`            | When true, only the immediately adjacent step can be reached by click or keyboard.                              |
| `orientation`       | `"horizontal" \| "vertical"`                         | `"horizontal"`    | Layout direction of the step list and track.                                                                    |
| `progressAriaLabel` | `string`                                             | `"Step progress"` | Accessible label for the progress bar. Localize this for non-English apps.                                      |
| `rounded`           | `"none" \| "small" \| "medium" \| "large" \| "full"` | `"full"`          | Border-radius preset applied to each step indicator.                                                            |
| `step`              | `number`                                             | `0`               | Two-way bindable active step index. Use `[(step)]` for two-way binding or `(stepChange)` to listen for changes. |
| `steps`             | `Iterable<StepOptions>`                              | `[]`              | Ordered list of step definitions.                                                                               |

#### Outputs

| Name         | Type     | Description                                                                  |
| ------------ | -------- | ---------------------------------------------------------------------------- |
| `stepChange` | `number` | Emitted when the active step changes. Carries the new zero-based step index. |

---

### `StepperIndicatorTemplateDirective`

**Selector:** `ng-template[monaStepperIndicatorTemplate]`

Replaces the content inside each step indicator. Template context: `StepperTemplateContext<T>` (see table above).

### `StepperLabelTemplateDirective`

**Selector:** `ng-template[monaStepperLabelTemplate]`

Replaces the default label span. Same template context as above.

### `StepperStepTemplateDirective`

**Selector:** `ng-template[monaStepperStepTemplate]`

Replaces the entire visual step unit. The component wraps projected content in an accessible `role="button"` element. Same template context as above.

---

### Exported Types

#### `StepOptions<T = unknown>`

| Field      | Type      | Required | Description                                                                             |
| ---------- | --------- | -------- | --------------------------------------------------------------------------------------- |
| `label`    | `string`  | Yes      | Display label and accessible name for the indicator.                                    |
| `data`     | `T`       | No       | Arbitrary data attached to this step. Available in template contexts as `step.data`.    |
| `disabled` | `boolean` | No       | When true, the step cannot be activated by click or keyboard regardless of linear mode. |

#### `StepItem<T = unknown>`

| Field     | Type             | Description                                  |
| --------- | ---------------- | -------------------------------------------- |
| `index`   | `number`         | Zero-based position of the step in the list. |
| `options` | `StepOptions<T>` | The original options object for this step.   |

#### `StepperTemplateContext<T = unknown>`

| Field          | Type             | Description                                                  |
| -------------- | ---------------- | ------------------------------------------------------------ |
| `$implicit`    | `StepOptions<T>` | The step's options object (bind with `let-myVar`).           |
| `active`       | `boolean`        | True when this step's index ≤ the current active step index. |
| `currentIndex` | `number`         | Zero-based index of the currently active step.               |
| `disabled`     | `boolean`        | Whether this step is disabled.                               |
| `index`        | `number`         | Zero-based index of this step.                               |

---

<!-- verification-checklist
- [x] All inputs and defaults verified against stepper.component.ts source
- [x] stepChange output verified — step is a model(), so stepChange is emitted automatically
- [x] Template directives verified against stepper.component.html contentChild queries
- [x] StepperTemplateContext fields verified against models/StepperTemplateContext.ts
- [x] StepOptions fields verified against models/Step.ts
- [x] aria-label alias verified (input("Progress", { alias: "aria-label" }))
- [x] No private or unexported APIs exposed
- [x] rounded variant values verified against stepper.styles.ts CVA config
- [x] orientation values verified against stepper.styles.ts CVA config
- [x] Keyboard map verified against setKeyboardEvents() in stepper.component.ts
- [x] ARIA attributes verified against stepper.component.html and host bindings
-->
