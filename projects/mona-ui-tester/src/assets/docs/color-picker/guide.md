## Overview

Use `ColorPickerComponent` when screen space is limited and the color editor should stay collapsed until the user opens it. It wraps a preview swatch and dropdown trigger; activating it opens a popup containing either a `ColorPaletteComponent` grid (`view="palette"`) or a `ColorGradientComponent` editor (`view="gradient"`).

Use `ColorPaletteComponent` directly when the palette should always be visible inline. Use `ColorGradientComponent` directly when the gradient editor should always be visible inline. Use `ColorPickerComponent` when either of those should be presented as an on-demand popup instead.

> **Forms.** `ColorPickerComponent` implements `FormValueControl<string | null>` from `@angular/forms/signals`, so use `[formField]` with signal forms. It has no `ControlValueAccessor`, but `[(ngModel)]`, `[formControl]` and `formControlName` work too, because Angular binds a control's `value` and `touch` directly when it has no accessor.

## Import & Quick Start

```typescript
import { ColorPickerComponent } from "@nanahoshi/mona-ui/color-picker";
```

**Direct value binding**

```html
<mona-color-picker [(value)]="color"></mona-color-picker>
```

```typescript
protected readonly color = signal<string | null>("#3498db");
```

**Signal forms**

```typescript
import { signal } from "@angular/core";
import { FormField, form } from "@angular/forms/signals";
import { ColorPickerComponent } from "@nanahoshi/mona-ui/color-picker";

protected readonly form = form(signal<{ color: string | null }>({ color: "#3498db" }));
```

```html
<mona-color-picker [formField]="form.color" view="palette"></mona-color-picker>
```

## Anatomy

The host renders a preview swatch (the currently selected color, or a "no color" icon when `value` is `null`) followed by a dropdown chevron button. Activating the host opens a popup with the view selected by the `view` input.

**Custom preview template**

Project an `ng-template` with the `monaColorPickerValueTemplate` directive to replace the default swatch. See [Custom preview](#custom-preview).

| Directive selector | Template context |
|---|---|
| `ng-template[monaColorPickerValueTemplate]` | `ColorPickerValueTemplateContext` — exposes the current value as `$implicit`. |

`let-color` is typed `string | null`, and it's `null` when no color is selected.

## Examples

### Palette view

Accepts the same `palette`, `columns` and `tileSize` inputs as `ColorPaletteComponent`, and `columns` only applies to a custom palette. See the [Color Palette](../color-palette) documentation for palette scheme details. `showClearButton` adds a button to the popup that resets `value` to `null`.

```example
color-picker/palette
```

Tiles are 24 pixels by default, and the built-in schemes have 18 to 20 columns, so their popup is up to about 480 pixels wide. On a smaller screen, the popup stops short of the viewport's width and scrolls.

### Gradient view

Accepts the `opacity` input, forwarded to the embedded `ColorGradientComponent`.

```example
color-picker/gradient
```

### Custom preview

`let-current` is the selected color, or `null` when there is none.

```example
color-picker/value-template
```

### Keep the popup open after selecting

```html
<mona-color-picker [(value)]="color" view="palette" [closeOnSelect]="false"></mona-color-picker>
```

`closeOnSelect` only affects the palette view — selecting a swatch or clearing the color normally closes the popup; setting it to `false` keeps the popup open. The gradient view has its own Apply/Cancel flow (see the Color Gradient documentation) and is not affected by this input.

### Clear button

`showClearButton`, shown in [Palette view](#palette-view), only applies to the palette view. It renders a button in the popup that resets `value` to `null`.

## Appearance & Styling

### Size and rounding

```html
<mona-color-picker [(value)]="color" size="large" rounded="full"></mona-color-picker>
```

Supported `size` values are `small`, `medium`, and `large`. Supported `rounded` values are `none`, `small`, `medium`, `large`, and `full`.

## Behavior

- The popup opens anchored below the host, left-aligned, with no backdrop.
- Clicking outside the popup closes it. Focus stays on what the click focused, such as another field. If the click focused nothing, focus returns to the host.
- The popup does not automatically reposition to stay within the viewport near screen edges.
- `disabled` and `readonly` prevent the popup from opening, and close it if either becomes `true` while it's open.
- The popup closes when the picker is destroyed.
- Closing the popup returns focus to the host, unless the user moved it elsewhere, for example by clicking another field.
- In the gradient view, closing the popup by any means other than Apply discards what wasn't applied.
- A color the gradient can't read, such as `var(--brand)`, shows as no color in the gradient view and warns in development. Apply writes a value only after an edit, so that color stays as it was written. A color outside sRGB comes back as its closest sRGB color once edited.
- Choosing the color that's already selected keeps it and closes the popup. To clear, use `showClearButton`.

## Forms Integration

`ColorPickerComponent` implements `FormValueControl<string | null>` from `@angular/forms/signals`.

```typescript
import { signal } from "@angular/core";
import { FormField, disabled, form } from "@angular/forms/signals";

protected readonly form = form(signal<{ color: string | null }>({ color: "#3498db" }), schema => {
    disabled(schema.color, { when: () => this.locked() });
});
```

```html
<mona-color-picker [formField]="form.color" view="palette"></mona-color-picker>
```

The `touch` output fires when the host loses focus with the popup closed, when the clear button is used, and when the popup closes. Selecting a palette color counts through that close, so with `[closeOnSelect]="false"` it waits until the popup closes. Focus moving into the popup doesn't fire it. The signal forms `FormField` directive listens to this output to mark the field as touched.

## Accessibility

### Keyboard Map

**On the closed host:**

| Key | Action |
|---|---|
| `Enter` / `Space` / `ArrowDown` / `ArrowUp` | Opens the popup (when not `disabled` or `readonly`). |

**Inside the open popup:**

| Key | Action |
|---|---|
| `Escape` | Closes the popup, drops an unapplied edit in the gradient view, and returns focus to the host. |
| `Tab` / `Shift+Tab` | Moves through the popup's controls. Going past the last or first one closes the popup like `Escape` and returns focus to the host, so the next `Tab` continues down the page. The popup isn't modal and doesn't trap focus. |

The palette grid is one Tab stop, so `Tab` from a tile closes the popup, and `Shift+Tab` reaches the clear button when there is one.

Once focus moves into the popup content, the embedded component's own keyboard map applies: see the palette-view grid navigation in the [Color Palette](../color-palette) documentation, or the gradient-view handle navigation in the [Color Gradient](../color-gradient) documentation.

### ARIA Roles

| Attribute | Where | Value |
|---|---|---|
| `role` | Host | `"combobox"` |
| `aria-haspopup` | Host | `"dialog"` |
| `aria-expanded` | Host | `"true"` while the popup is open, otherwise `"false"` |
| `aria-controls` | Host | The popup content element's `id`, only while it's open |
| `aria-label` | Host | The `aria-label` input, or `"Color picker"`. Absent when a label or `aria-labelledby` names the picker. |
| `aria-disabled` | Host | Reflects `disabled` |
| `aria-invalid` | Host | `"true"` once `touched` and either `invalid`, or `required` with no color. Otherwise absent. |
| `aria-readonly` | Host | Reflects `readonly` |
| `aria-required` | Host | Reflects `required` |
| `role` | Popup content | `"dialog"` |
| `aria-label` | Popup content | `"Color palette picker"` or `"Color gradient picker"`, matching `view` |
| `id` | Popup content | Matches the host's `aria-controls` |

The host also holds visually hidden text with the current color: its name when the palette gives it one, its value otherwise, or a translated "No color".

**Consumer responsibilities**

- Name each picker with `aria-label`, `aria-labelledby` or a `mona-label`, so screen reader users can tell them apart.

### Focus Behavior

Opening the popup moves focus into its content: the selected color, or the first one, in the palette view, and the saturation/value handle in the gradient view. Closing the popup returns focus to the host unless the user moved it elsewhere. The popup does not implement a focus trap.

<!-- verification-checklist
- [x] API definitions and defaults verified against source (color-picker.component.ts)
- [x] Basic examples use public imports from @nanahoshi/mona-ui/color-picker
- [x] Signal forms support verified against FormValueControl implementation and specs
- [x] ControlValueAccessor absence documented, and the custom-control path verified in @angular/forms 22 (NgControl.ngControlCreate)
- [x] Keyboard maps verified against setKeyboardEventListeners()/setupPopupKeyboardHandling()/tabLeavesPopup() and specs
- [x] ARIA attributes verified against color-picker.component.ts host bindings and color-picker.component.html
- [x] Focus restoration and popup-open focus targeting verified against open()/focusPopupContent(), focusCanReturn() and specs
- [x] aria-label input verified against host binding
- [x] Form interaction verified: disabled/readonly gate popup opening; already-open popup reflects state changes (verified by spec + source)
- [x] Inputs and outputs tables sorted A-Z within each section
- [x] No private methods, internal signals, Tailwind utility classes, or implementation-only DOM/data-* details exposed
- [x] Exported ColorPickerView/ColorPickerValueTemplateContext/variant types verified against public-api.ts
- [x] ColorPickerValueTemplateContext typing verified: $implicit is string | null, with a context guard on the directive
-->
