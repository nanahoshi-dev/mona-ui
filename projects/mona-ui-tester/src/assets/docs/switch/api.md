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
import { SwitchComponent } from "@nanahoshi/mona-ui";
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

> **`SwitchComponent` does NOT implement `ControlValueAccessor`.** It cannot be used with `[(ngModel)]`, `[formControl]`, or `formControlName`. For traditional Angular forms, bind the `checked` model manually or use signal forms.

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

`SwitchComponent` implements `FormCheckboxControl` from `@angular/forms/signals`. Connect it to a signal form field using the `[formField]` binding provided by the signal forms `Field` directive:

```typescript
import { form, disabled } from "@angular/forms/signals";

protected readonly myForm = form({ notifications: false });
```

```html
<mona-switch [formField]="myForm.notifications" aria-label="Enable notifications"></mona-switch>
```

The `disabled` state can be managed declaratively from the form schema. The `touch` output fires when the switch is toggled or loses focus, signaling the field as touched.

> **`SwitchComponent` does NOT implement `ControlValueAccessor`.** Use signal forms `[formField]` for forms integration. `[(ngModel)]`, `[formControl]`, and `formControlName` are not supported.

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

| State           | Appearance                                                 |
|-----------------|------------------------------------------------------------|
| Off             | Track uses the theme's input background and border         |
| On (checked)    | Track fills with the primary color                         |
| Focused         | Visible focus ring using the primary color                 |
| Disabled        | Reduced opacity, no pointer interaction                    |
| Invalid (forms) | Border changes to the error color when touched and invalid |

### Custom classes

Pass additional CSS classes via the `class` attribute. They are merged onto the host element via `tailwind-merge`:

```html
<mona-switch [(checked)]="enabled" class="my-2" aria-label="Enable feature"></mona-switch>
```

## Accessibility Notes

`SwitchComponent` manages the following on its host element:

| Attribute       | When present  | Value                            |
|-----------------|---------------|----------------------------------|
| `role`          | Always        | `"switch"`                       |
| `aria-checked`  | Always        | `true` or `false`                |
| `aria-disabled` | When disabled | `true`                           |
| `tabindex`      | Always        | `0` (enabled) or `-1` (disabled) |

**Consumer responsibilities:**

The switch has no visible text label of its own. You must provide an accessible name using one of:

- `aria-label` input: `<mona-switch aria-label="Enable dark mode">`
- `aria-labelledby` input: reference an existing element by ID: `<mona-switch aria-labelledby="setting-label-id">`

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

| Name              | Type                                                 | Default    | Description                                                                                                                                        |
|-------------------|------------------------------------------------------|------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| `aria-label`      | `string \| null`                                     | `null`     | Accessible name for the host element. Describe what the component represents. When empty, assistive technology announces the role without a label. |
| `aria-labelledby` | `string \| null`                                     | `null`     | ID of an external element that provides the accessible name for the host element.                                                                  |
| `checked`         | `boolean`                                            | `false`    | Two-way bindable. Whether the control is checked. Implements `FormCheckboxControl`, enabling use with the signal forms `[formField]` binding.      |
| `class`           | `string`                                             | `''`       | Additional CSS classes merged onto the host element via `tailwind-merge`.                                                                          |
| `disabled`        | `boolean`                                            | `false`    | Renders the component with reduced visual emphasis and removes pointer interaction.                                                                |
| `offLabel`        | `string`                                             | `''`       | Label displayed inside the switch track when it is in the off state. Overridden by `monaSwitchOffLabelTemplate` when provided.                     |
| `onLabel`         | `string`                                             | `''`       | Label displayed inside the switch track when it is in the on state. Overridden by `monaSwitchOnLabelTemplate` when provided.                       |
| `rounded`         | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'full'`   | Border-radius preset applied to the component.                                                                                                     |
| `size`            | `'small' \| 'medium' \| 'large'`                     | `'medium'` | Size preset controlling the component's dimensions.                                                                                                |

#### Outputs

| Name    | Type   | Description                                                                                                                            |
|---------|--------|----------------------------------------------------------------------------------------------------------------------------------------|
| `touch` | `void` | Emitted when the switch loses focus or its value changes. Consumed by the signal forms `Field` directive to mark the field as touched. |

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
import {
    SwitchComponent,
    SwitchOnLabelTemplateDirective,
    SwitchOffLabelTemplateDirective,
    SwitchHandleContentTemplateDirective
} from "@nanahoshi/mona-ui";
```

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source
- [x] checked model documented as two-way bindable
- [x] touch output documented
- [x] class input (userClass alias) documented
- [x] aria-label and aria-labelledby inputs documented
- [x] All three template directives documented with context
- [x] FormCheckboxControl documented; ControlValueAccessor absence explicitly stated
- [x] ngModel/formControl/formControlName unsupported — noted prominently
- [x] Keyboard handling (Space + Enter) verified from source
- [x] Accessible name consumer responsibility documented
- [x] onLabel/offLabel clarified as not serving as accessible name
- [x] Inputs table sorted A→Z
- [x] No internal or unexported APIs exposed
- [x] No Tailwind class names or internal data attributes in docs
-->
