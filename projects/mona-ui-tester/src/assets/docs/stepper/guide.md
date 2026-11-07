## Overview

Use the Stepper when a task must be completed in a defined series of stages — a checkout flow, a configuration wizard, an onboarding sequence. The component enforces ordering rules, tracks the active step, and communicates progress through a built-in progress bar.

**Linear mode** (default) constrains navigation: the user can only move to the nearest enabled step before or after the current one. **Non-linear mode** lets users jump to any step freely. Individual steps can also be permanently disabled regardless of the current mode.

## Import & Quick Start

```typescript
import { StepperComponent } from "@nanahoshi/mona-ui/stepper";
import type { StepOptions } from "@nanahoshi/mona-ui/stepper";
```

Add `StepperComponent` to your standalone component's `imports` array.

```typescript
protected readonly steps: StepOptions[] = [
    { label: "Account" },
    { label: "Profile" },
    { label: "Review" }
];

protected readonly currentStep = signal(0);
```

```html
<mona-stepper [steps]="steps" [(step)]="currentStep"></mona-stepper>
```

## Anatomy & Structural Templates

Each step renders an **indicator** (the numbered circle, which shows a check when the step is completed and an alert when it has errors) and a **label** (the text below or beside it). Three `ng-template` directives let you replace either part, or replace the entire step unit:

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
| `invalid`                | `boolean`        | Whether this step has errors                                |
| `state`                  | `StepState`      | `current`, `completed`, `upcoming` or `disabled`            |

Import all three alongside the component:

```typescript
import {
    StepperComponent,
    StepperIndicatorTemplateDirective,
    StepperLabelTemplateDirective,
    StepperStepTemplateDirective
} from "@nanahoshi/mona-ui/stepper";
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

Replaces the entire visual step unit. The component wraps the projected content in a native `button` that preserves keyboard navigation and ARIA semantics, so put phrasing content in it, and no links or other controls. The button carries a focus outline, but anything else about how the state looks is up to the template.

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

Set `disabled: true` on individual steps to permanently block activation regardless of linear mode. Disabled steps are skipped during keyboard arrow navigation, and a linear stepper counts the step after one as adjacent, so it never gets stuck behind it.

```typescript
protected readonly steps: StepOptions[] = [
    { label: "Account" },
    { label: "Suspended", disabled: true },
    { label: "Review" }
];
```

### Stopping a step change

`stepSelect` fires before a click or key changes the step, and the keys that change it are `Enter` and `Space`, since the arrows only move focus. Call `preventDefault()` to stay where you are, for example while the current step's form is invalid. It's a veto rather than a correction, so there's no flicker to undo. It doesn't fire when `step` is written from outside, so it can't veto your own Next and Back buttons, or for a click on the current or a locked step.

```html
<mona-stepper [steps]="steps" [(step)]="currentStep" (stepSelect)="onStepSelect($event)"></mona-stepper>
```

```typescript
protected onStepSelect(event: StepSelectEvent): void {
    if (event.index > event.previousIndex && this.form().invalid()) {
        event.preventDefault();
    }
}
```

### Step states

Steps before the current one count as completed. Set `completed` when that isn't true: `false` for a step that was passed without being finished, `true` for one finished ahead of the current step. Set `invalid` on a step with errors. Both show on the indicator, and are read out as part of the step's description.

```typescript
protected readonly steps = computed<StepOptions[]>(() => [
    { label: "Account", invalid: this.accountForm().invalid() },
    { label: "Profile", completed: this.profileForm().valid() },
    { label: "Review" }
]);
```

| State       | Looks like                                                      |
| ----------- | --------------------------------------------------------------- |
| `current`   | Filled, with a ring around it and a heavier label               |
| `completed` | Filled, with a check in place of the number                     |
| `upcoming`  | Outlined, with the number                                       |
| `disabled`  | Muted, with a dashed border and a muted label                   |
| `invalid`   | An alert icon and an error-colored border, on top of the others |

There's no optional state. To mark a step as optional, say so in its `label`.

### Step values

`step` is normalized once there are steps to measure it against: below zero becomes the first step, past the end becomes the last, and a fraction is cut to a whole number. With `[(step)]` the corrected value comes back to you through `stepChange`. Writing `step` can land on a disabled step, because that's the application's decision, and it then shows as current.

### Focus

The stepper moves focus only in response to its own keys. Rendering it, or changing `step` from your own Next and Back buttons, leaves focus where it is.

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

## Behavior

- `"completed" | "current" | "disabled" | "upcoming"`. `current` outranks the others, and `disabled` outranks `completed` and `upcoming`.

## Keyboard & Accessibility

### Keyboard map

| Key                                                | Action                                    |
| -------------------------------------------------- | ----------------------------------------- |
| `ArrowLeft` (horizontal) / `ArrowUp` (vertical)    | Move focus to the previous reachable step |
| `ArrowRight` (horizontal) / `ArrowDown` (vertical) | Move focus to the next reachable step     |
| `Home`                                             | Move focus to the first reachable step    |
| `End`                                              | Move focus to the last reachable step     |
| `Enter` / `Space`                                  | Activate the step that has focus          |

A reachable step is one you could activate: never a disabled step, and in linear mode only the nearest enabled steps on either side of the current one. In a right-to-left layout, `ArrowLeft` and `ArrowRight` swap. The stepper uses a **roving tabindex** pattern — only one step has `tabindex="0"`. These keys only count on the step buttons, without `Alt`, `Ctrl`, `Meta` or `Shift`, so a control in a label template keeps its own keys and clicks.

### ARIA attributes

| Attribute                         | Element                   | When                             | Value                                                    |
| --------------------------------- | ------------------------- | -------------------------------- | -------------------------------------------------------- |
| `role="group"`                    | Host                      | Always                           | —                                                        |
| `aria-label`                      | Host                      | Always                           | `aria-label` input, or the `stepper` message             |
| Native `button`                   | Each step indicator       | Always                           | —                                                        |
| `aria-label`                      | Each step indicator       | Always                           | Step's `label` string                                    |
| `aria-describedby`                | Each step indicator       | Always                           | Hidden text: position, completed and errors              |
| `aria-current="step"`             | Active step indicator     | When this step is active         | `"step"`                                                 |
| `aria-disabled="true"`            | Locked/disabled indicator | When locked (linear) or disabled | `true`                                                   |
| `tabindex="0"`                    | The step's Tab stop       | One step at a time               | `0`                                                      |
| `tabindex="-1"`                   | All other indicators      | Otherwise                        | `-1`                                                     |
| `role="list"`                     | The `<ol>`                | Always                           | —                                                        |
| `role="progressbar"`              | Progress track            | Always                           | —                                                        |
| `aria-valuenow`                   | Progress track            | Always                           | Current step index                                       |
| `aria-valuetext`                  | Progress track            | With steps                       | `stepPosition` message, such as "Step 2 of 4"            |
| `aria-valuemin` / `aria-valuemax` | Progress track            | Always                           | `0` / total steps minus one                              |
| `aria-label`                      | Progress track            | Always                           | `progressAriaLabel` input, or the `stepProgress` message |

Both names are localized when you leave the inputs empty: the `stepper` message is "Progress" in English, and `stepProgress` is "Step progress".

**Consumer responsibilities:**

- Provide a meaningful `aria-label` when context does not already identify the stepper's purpose.
- All `label` fields in `StepOptions` are required and become the accessible name for each indicator.
- A custom step or indicator template replaces the check and alert icons, so show `state` and `invalid` in it some way other than color.

<!-- verification-checklist
- [x] All inputs and defaults verified against stepper.component.ts source
- [x] stepChange output verified — step is a model(), so stepChange is emitted automatically
- [x] Template directives verified against stepper.component.html contentChild queries
- [x] StepperTemplateContext fields verified against models/StepperTemplateContext.ts
- [x] StepOptions fields verified against models/Step.ts
- [x] aria-label alias verified (input("", { alias: "aria-label" })), with the fallback to the stepper message in the host binding
- [x] No private or unexported APIs exposed
- [x] rounded variant values verified against stepper.styles.ts CVA config
- [x] orientation values verified against stepper.styles.ts CVA config
- [x] Keyboard map verified against onKeydown() in stepper.component.ts and stepper-behavior.spec.ts
- [x] ARIA attributes verified against stepper.component.html and host bindings
-->
