## Overview

`SwitchComponent` represents a binary setting that takes immediate effect when toggled. Use it when the action is immediate and the on/off metaphor communicates the intent clearly — for example, enabling a notification preference or activating dark mode.

**Use Switch instead of Checkbox when:**

- The change takes effect immediately without a form submission step
- The on/off states benefit from distinct visible labels or icons inside the track
- A sliding handle conveys the toggle metaphor better than a checkmark

**Use Checkbox instead when:**

- The control is part of a form the user submits explicitly
- Multiple boolean options are listed together
- An indeterminate "select all" state is needed

## Import & Basic Usage

```typescript
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";
```

**Direct binding:**

```html
<mona-switch [(checked)]="enabled" aria-label="Enable notifications"></mona-switch>
```

**With string labels:**

```html
<mona-switch [(checked)]="enabled" onLabel="On" offLabel="Off" aria-label="Enable notifications"></mona-switch>
```

**Signal forms integration:**

```html
<mona-switch [formField]="notificationsField" aria-label="Enable notifications"></mona-switch>
```

## Label Customization

`onLabel` and `offLabel` display text inside the switch track on the respective sides of the handle.

```html
<mona-switch [(checked)]="enabled" onLabel="On" offLabel="Off" aria-label="Theme"></mona-switch>
```

Replace the text with any markup using the `monaSwitchOnLabelTemplate` and `monaSwitchOffLabelTemplate` structural directives. When both a string input and a template are provided, the template takes precedence.

```html
<mona-switch [(checked)]="darkMode" aria-label="Dark mode">
    <ng-template monaSwitchOnLabelTemplate>
        <svg lucideSun [size]="14"></svg>
    </ng-template>
    <ng-template monaSwitchOffLabelTemplate>
        <svg lucideMoon [size]="14"></svg>
    </ng-template>
</mona-switch>
```

## Handle Customization

Use `monaSwitchHandleContentTemplate` to replace the default empty handle circle with custom content. The template context exposes the current checked state as the implicit variable:

```html
<mona-switch [(checked)]="darkMode" aria-label="Dark mode">
    <ng-template monaSwitchHandleContentTemplate let-active>
        @if (active) {
            <svg lucideSun [size]="14"></svg>
        } @else {
            <svg lucideMoon [size]="14"></svg>
        }
    </ng-template>
</mona-switch>
```

## Forms Integration

`SwitchComponent` implements `FormCheckboxControl` from `@angular/forms/signals`. Connect it to a signal form field using the `[formField]` binding provided by the signal forms `FormField` directive:

```typescript
import { signal } from "@angular/core";
import { form, FormField } from "@angular/forms/signals";

protected readonly myForm = form(signal({ notifications: false }));
```

```html
<mona-switch [formField]="myForm.notifications" aria-label="Enable notifications"></mona-switch>
```

`FormField` writes `checked`, `disabled`, `invalid`, `readonly`, `required` and `touched`. Don't set those on the same element, because Angular rejects the template. The `touch` output fires when the switch is toggled or loses focus, marking the field as touched. The signal forms `required` rule treats a switch that's off as empty.

The switch has no `name` input, because it has no native input.

`SwitchComponent` doesn't implement `ControlValueAccessor`. `[(ngModel)]` binds to its `checked` model through Angular's support for custom controls, the same way it does for `CheckBoxComponent`. Import `FormsModule` for it.

## Read-only

`readonly` blocks toggling by pointer, keyboard and label, while the switch stays focusable and readable. It sets `aria-readonly="true"`. With `[formField]`, the signal forms `readonly` rule writes it.

## Appearance & Styling

### Size presets

| `size`   | Description                   |
|----------|-------------------------------|
| `small`  | Compact track and handle      |
| `medium` | Standard size (default)       |
| `large`  | Wider track and taller handle |

### Rounded presets

| `rounded` | Shape                               |
|-----------|-------------------------------------|
| `none`    | No rounding                         |
| `small`   | Slight rounding                     |
| `medium`  | Moderate rounding                   |
| `large`   | Strong rounding                     |
| `full`    | Fully rounded, pill shape (default) |

### Visual states

| State           | Appearance                                                                |
|-----------------|---------------------------------------------------------------------------|
| Off             | Track uses the theme's input background and border                        |
| On (checked)    | Track fills with the primary color                                        |
| Focused         | Visible focus indicator                                                   |
| Disabled        | Disabled colors, no pointer interaction                                   |
| Read-only       | Default cursor, otherwise unchanged                                       |
| Invalid (forms) | Error color once touched, when `invalid` is `true` or a `required` switch is off |

### Custom classes

Pass additional CSS classes via the `class` attribute. They are merged onto the host element via `tailwind-merge`:

```html
<mona-switch [(checked)]="enabled" class="my-2" aria-label="Enable feature"></mona-switch>
```

## Accessibility Notes

`SwitchComponent` manages the following on its host element:

| Attribute         | When present               | Value                                       |
|-------------------|----------------------------|---------------------------------------------|
| `role`            | Always                     | `"switch"`                                  |
| `aria-checked`    | Always                     | `true` or `false`                           |
| `aria-disabled`   | When disabled              | `true`                                      |
| `aria-invalid`    | When the invalid state shows | `true`                                    |
| `aria-readonly`   | When read-only             | `true`                                      |
| `aria-required`   | When required              | `true`                                      |
| `tabindex`        | Always                     | The `tabindex` input, or `-1` when disabled |

**Consumer responsibilities:**

The switch has no visible text label of its own. You must provide an accessible name using one of:

- `aria-label` input: `<mona-switch aria-label="Enable dark mode">`
- `aria-labelledby` input: reference an existing element by ID: `<mona-switch aria-labelledby="setting-label-id">`
- A `mona-label` with `text` wrapped around it. A click on the caption toggles the switch.
- A `mona-label` or `label[monaLabel]` bound to it with `[for]="ref"`. A string `for` can't work, because the switch has no native input.

The `onLabel` and `offLabel` inputs display text *inside the track* — they do not serve as the accessible name for the switch element.

**Keyboard interaction:**

| Key     | Action                    |
|---------|---------------------------|
| `Space` | Toggles the switch on/off |
| `Enter` | Toggles the switch on/off |

`Space` also suppresses the default browser page-scroll behavior.

## API

### `SwitchComponent`

**Selector:** `mona-switch`

Implements `FormCheckboxControl` from `@angular/forms/signals`. Use `[(checked)]` for direct binding or the `[formField]` binding for signal forms integration.

#### Inputs

| Name              | Type                                                 | Default    | Description                                                                                                                    |
|-------------------|------------------------------------------------------|------------|--------------------------------------------------------------------------------------------------------------------------------|
| `aria-label`      | `string \| null`                                     | `null`     | Accessible name for the switch. Describe what it represents.                                                                   |
| `aria-labelledby` | `string \| null`                                     | `null`     | ID of an external element that provides the accessible name for the switch.                                                    |
| `checked`         | `boolean`                                            | `false`    | Two-way. Whether the switch is on. `FormField` keeps it in sync when bound with `[formField]`.                                 |
| `class`           | `string`                                             | `''`       | Additional CSS classes merged onto the host element via `tailwind-merge`.                                                      |
| `disabled`        | `boolean`                                            | `false`    | Uses the disabled colors and removes pointer and keyboard interaction.                                                         |
| `invalid`         | `boolean`                                            | `false`    | Marks the switch as invalid. It shows once `touched` is also `true`. `FormField` writes it.                                    |
| `offLabel`        | `string`                                             | `''`       | Label displayed inside the switch track when it is in the off state. Overridden by `monaSwitchOffLabelTemplate` when provided. |
| `onLabel`         | `string`                                             | `''`       | Label displayed inside the switch track when it is in the on state. Overridden by `monaSwitchOnLabelTemplate` when provided.   |
| `readonly`        | `boolean`                                            | `false`    | Prevents value changes while the switch stays focusable and readable. `FormField` writes it.                                   |
| `required`        | `boolean`                                            | `false`    | Sets `aria-required`, and shows the invalid state once touched while the switch is off. `FormField` writes it.                 |
| `rounded`         | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'full'`   | Border-radius preset applied to the component.                                                                                 |
| `size`            | `'small' \| 'medium' \| 'large'`                     | `'medium'` | Size preset controlling the component's dimensions.                                                                            |
| `tabindex`        | `number`                                             | `0`        | Tab index of the switch while it's enabled. Numeric strings are converted.                                                     |
| `touched`         | `boolean`                                            | `false`    | Marks the switch as touched. `FormField` writes it.                                                                            |

#### Outputs

| Name    | Type   | Description                                                                                                                                |
|---------|--------|--------------------------------------------------------------------------------------------------------------------------------------------|
| `touch` | `void` | Emitted when the switch loses focus or its value changes. Consumed by the signal forms `FormField` directive to mark the field as touched. |

#### Methods

| Method                          | Description               |
|---------------------------------|---------------------------|
| `focus(options?: FocusOptions)` | Moves focus to the switch. |

---

### Template Directives

These structural directives are projected inside `<mona-switch>` to customize specific parts of the switch.

| Directive selector                             | Template context                     | Description                                                                                               |
|------------------------------------------------|--------------------------------------|-----------------------------------------------------------------------------------------------------------|
| `ng-template[monaSwitchOnLabelTemplate]`       | None                                 | Replaces the on-state label. Takes precedence over `onLabel`.                                             |
| `ng-template[monaSwitchOffLabelTemplate]`      | None                                 | Replaces the off-state label. Takes precedence over `offLabel`.                                           |
| `ng-template[monaSwitchHandleContentTemplate]` | `$implicit: boolean` (checked state) | Replaces the content inside the sliding handle. The implicit variable reflects the current checked state. |

**Imports:**

```typescript
import { SwitchComponent, SwitchHandleContentTemplateDirective, SwitchOffLabelTemplateDirective, SwitchOnLabelTemplateDirective } from "@nanahoshi/mona-ui/switch";
```
