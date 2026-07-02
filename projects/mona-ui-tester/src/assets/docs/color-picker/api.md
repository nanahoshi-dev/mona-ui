## Overview & Component Selection

Use `ColorPickerComponent` when screen space is limited and the color editor should stay collapsed until the user opens it. It wraps a preview swatch and dropdown trigger; activating it opens a popup containing either a `ColorPaletteComponent` grid (`view="palette"`) or a `ColorGradientComponent` editor (`view="gradient"`).

Use `ColorPaletteComponent` directly when the palette should always be visible inline. Use `ColorGradientComponent` directly when the gradient editor should always be visible inline. Use `ColorPickerComponent` when either of those should be presented as an on-demand popup instead.

> **Signal forms only.** `ColorPickerComponent` implements `FormValueControl<string | null>` from `@angular/forms/signals`. It does not implement `ControlValueAccessor`, so `[(ngModel)]`, `[formControl]`, and `formControlName` are not supported.

## Import & Quick Start

```typescript
import { ColorPickerComponent } from "mona-ui";
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
import { form } from "@angular/forms/signals";
import { ColorPickerComponent } from "mona-ui";

protected readonly form = form({ color: "#3498db" });
```

```html
<mona-color-picker [formField]="form.color" view="palette"></mona-color-picker>
```

## Anatomy & Public Structural Templates

The host renders a preview swatch (the currently selected color, or a "no color" icon when `value` is `null`) followed by a dropdown chevron button. Activating the host opens a popup with the view selected by the `view` input.

**Custom preview template**

Project an `ng-template` with the `monaColorPickerValueTemplate` directive to replace the default swatch:

```html
<mona-color-picker [(value)]="color">
    <ng-template monaColorPickerValueTemplate let-color>
        <span class="text-xs">{{ color ?? "None" }}</span>
    </ng-template>
</mona-color-picker>
```

| Directive selector | Template context |
|---|---|
| `ng-template[monaColorPickerValueTemplate]` | `ColorPickerValueTemplateContext` — exposes the current value as `$implicit`. |

TODO(owner-review): `ColorPickerValueTemplateContext.$implicit` is typed as `string`, but the value bound at runtime is `value()`, which is `string | null`. The directive also does not define a `ngTemplateContextGuard`, so `let color` is not type-checked against this context. Treat the projected value as `string | null` until this is resolved.

## Feature Examples

### Palette view

```html
<mona-color-picker [(value)]="color" view="palette" palette="material" [columns]="8"></mona-color-picker>
```

Accepts the same `palette` and `columns` inputs as `ColorPaletteComponent`. See the [Color Palette](../color-palette) documentation for palette scheme details.

### Gradient view

```html
<mona-color-picker [(value)]="color" view="gradient" [opacity]="false"></mona-color-picker>
```

Accepts the `opacity` input, forwarded to the embedded `ColorGradientComponent`.

### Keep the popup open after selecting

```html
<mona-color-picker [(value)]="color" view="palette" [closeOnSelect]="false"></mona-color-picker>
```

`closeOnSelect` only affects the palette view — selecting a swatch normally closes the popup; setting it to `false` keeps the popup open. The gradient view has its own Apply/Cancel flow (see the Color Gradient documentation) and is not affected by this input.

### Clear button

```html
<mona-color-picker [(value)]="color" view="palette" [showClearButton]="true"></mona-color-picker>
```

Only applies to the palette view. Renders a button in the popup that resets `value` to `null`.

### Size and rounding

```html
<mona-color-picker [(value)]="color" size="large" rounded="full"></mona-color-picker>
```

Supported `size` values are `small`, `medium`, and `large`. Supported `rounded` values are `none`, `small`, `medium`, `large`, and `full`.

## Technical & Behavior Notes

- The popup opens anchored below the host, left-aligned, with no backdrop. Clicking outside the popup closes it.
- The popup does not automatically reposition to stay within the viewport near screen edges.
- `disabled` and `readonly` prevent the popup from opening. If either becomes `true` while the popup is already open, the embedded palette or gradient control reflects the new state immediately (selection/interaction becomes blocked), but the popup does not auto-close.
- Closing the popup (via selection, Escape, Tab, or an outside click) restores keyboard focus to the host element.

## Accessibility & Forms Integration

### Keyboard Map

**On the closed host:**

| Key | Action |
|---|---|
| `Enter` / `Space` / `ArrowDown` / `ArrowUp` | Opens the popup (when not `disabled` or `readonly`). |
| `Escape` | Closes the popup if it is open. |

**Inside the open popup:**

| Key | Action |
|---|---|
| `Escape` | Closes the popup and returns focus to the host. |
| `Tab` | Closes the popup. The popup does not trap focus — it is a light-dismiss popup, not a modal dialog. |

Once focus moves into the popup content, the embedded component's own keyboard map applies: see the palette-view grid navigation in the [Color Palette](../color-palette) documentation, or the gradient-view handle navigation in the Color Gradient documentation.

### ARIA Roles

| Attribute | Where | Value |
|---|---|---|
| `role` | Host | `"combobox"` |
| `aria-haspopup` | Host | `"dialog"` |
| `aria-expanded` | Host | `"true"` while the popup is open, otherwise absent |
| `aria-controls` | Host | The popup content element's `id` |
| `aria-label` | Host | `"Color picker"` (fixed, not configurable) |
| `aria-disabled` | Host | Reflects `disabled` |
| `aria-invalid` | Host | `"true"` when invalid, otherwise absent |
| `aria-readonly` | Host | Reflects `readonly` |
| `aria-required` | Host | Reflects `required` |
| `role` | Popup content | `"dialog"` |
| `aria-label` | Popup content | `"Color palette picker"` or `"Color gradient picker"`, matching `view` |
| `id` | Popup content | Matches the host's `aria-controls` |

**Consumer responsibilities**

- The host's accessible name is fixed to the literal text `"Color picker"` and is not exposed through a public input. If a page shows multiple color pickers, screen reader users cannot distinguish between them by name alone.

### Focus Behavior

Opening the popup moves focus into its content: the palette container (palette view) or the saturation/value handle (gradient view). Closing the popup — by selection, Escape, Tab, or an outside click — restores focus to the host element. The popup does not implement a focus trap.

### Form Interaction

`ColorPickerComponent` implements `FormValueControl<string | null>` from `@angular/forms/signals`.

```typescript
import { disabled, form } from "@angular/forms/signals";

protected readonly form = form({ color: "#3498db" }, schema => {
    disabled(schema.color, { when: () => this.locked() });
});
```

```html
<mona-color-picker [formField]="form.color" view="palette"></mona-color-picker>
```

The `touch` output fires when the host loses focus, or when a palette/gradient selection is made. The signal forms `FormField` directive listens to this output to mark the field as touched.

## API

### `ColorPickerComponent`

**Selector:** `mona-color-picker`

Implements `FormValueControl<string | null>` from `@angular/forms/signals`.

#### Inputs

| Name | Type | Default | Description |
|---|---|---|---|
| `closeOnSelect` | `boolean` | `true` | Closes the popup when a color is selected. Only applies to the palette view. |
| `columns` | `number` | `10` | Number of columns in the color palette grid. Only applies to the palette view with a custom `palette` array. |
| `disabled` | `boolean` | `false` | Renders the component with reduced visual emphasis and removes pointer interaction. |
| `invalid` | `boolean` | `false` | Marks the color picker as invalid. When bound via `[formField]`, this is written by the `FormField` directive. |
| `opacity` | `boolean` | `true` | Shows the opacity slider. Only applies to the gradient view. |
| `palette` | `"flat" \| "material" \| "websafe" \| Iterable<string>` | `"flat"` | The palette to display in palette view — a built-in scheme name, or a custom iterable of CSS color strings. |
| `readonly` | `boolean` | `false` | Prevents value changes while preserving the component's visual state. When bound via `[formField]`, this is written by the `FormField` directive. |
| `required` | `boolean` | `false` | Marks the color picker as required. When bound via `[formField]`, this is written by the `FormField` directive. |
| `rounded` | `"none" \| "small" \| "medium" \| "large" \| "full"` | `"medium"` | Border-radius preset applied to the color picker. |
| `showClearButton` | `boolean` | `false` | Shows a button in the popup that resets `value` to `null`. Only applies to the palette view. |
| `size` | `"small" \| "medium" \| "large"` | `"medium"` | Size preset controlling the color picker's dimensions. |
| `touched` | `boolean` | `false` | Marks the color picker as touched. When bound via `[formField]`, this is written by the `FormField` directive. |
| `value` | `string \| null` | `null` | Two-way bindable current color value. Implements `FormValueControl<string \| null>`, enabling the signal forms `[formField]` binding. |
| `view` | `"gradient" \| "palette"` | `"gradient"` | Which editor the popup shows: the color palette grid, or the color gradient editor. |

#### Outputs

| Name | Type | Description |
|---|---|---|
| `touch` | `void` | Emitted when the color picker is interacted with on blur or color selection. Consumed by the signal forms `FormField` directive to mark the field as touched. |

### Public Directives

| Name | Selector | Description |
|---|---|---|
| `ColorPickerValueTemplateDirective` | `ng-template[monaColorPickerValueTemplate]` | Marks a projected `ng-template` used to render a custom preview swatch instead of the default one. |

### Exported Types

| Name | Shape | Description |
|---|---|---|
| `ColorPickerView` | `"gradient" \| "palette"` | The literal union accepted by `view`. |
| `ColorPickerValueTemplateContext` | `{ $implicit: string }` | Template context type for `monaColorPickerValueTemplate`. See the TODO above regarding its accuracy against the runtime `string \| null` value. |
| `ColorPickerVariantProps` / `ColorPickerVariantInput` | — | Variant prop types backing the `rounded` and `size` inputs' literal unions, exported for advanced typing scenarios. |

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source (color-picker.component.ts) and component-metadata.json
- [x] Basic examples use public imports from mona-ui
- [x] Signal forms support verified against FormValueControl implementation and specs
- [x] ControlValueAccessor absence documented
- [x] Keyboard maps verified against setKeyboardEventListeners()/onPaletteContainerKeyDown()/setupPopupKeyboardHandling() and specs
- [x] ARIA attributes verified against color-picker.component.ts host bindings and color-picker.component.html (aria-controls/role=dialog added in this pass)
- [x] Focus restoration and popup-open focus targeting verified against open()/focusPopupContent() and live browser testing
- [x] Fixed aria-label limitation verified against host binding (static "'Color picker'" literal, no input)
- [x] Form interaction verified: disabled/readonly gate popup opening; already-open popup reflects state changes (verified by spec + source)
- [x] Inputs and outputs tables sorted A-Z within each section
- [x] No private methods, internal signals, Tailwind utility classes, or implementation-only DOM/data-* details exposed
- [x] Exported ColorPickerView/ColorPickerValueTemplateContext/variant types verified present in lib/index.ts and dist d.ts
- [x] Unclear/inaccurate typing (ColorPickerValueTemplateContext) marked with TODO(owner-review)
-->
