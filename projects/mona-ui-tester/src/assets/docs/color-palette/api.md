## Overview

Use `ColorPaletteComponent` when the user should choose only from a known, bounded set of colors rather than compose an arbitrary one. Use `ColorGradientComponent` when the user needs to choose a custom color. Use `ColorPickerComponent` when the palette (or gradient) editor should open from a compact dropdown-style control instead of being shown inline.

> **Signal forms only.** `ColorPaletteComponent` implements `FormValueControl<string | null>` from `@angular/forms/signals`. It does not implement `ControlValueAccessor`, so `[(ngModel)]`, `[formControl]`, and `formControlName` are not supported.

## Import & Quick Start

```typescript
import { ColorPaletteComponent } from "mona-ui";
```

**Direct value binding**

```html
<mona-color-palette [(value)]="color"></mona-color-palette>
```

```typescript
protected readonly color = signal<string | null>("#3498db");
```

**Signal forms**

```typescript
import { form } from "@angular/forms/signals";
import { ColorPaletteComponent } from "mona-ui";

protected readonly form = form({ color: "#3498db" });
```

```html
<mona-color-palette [formField]="form.color"></mona-color-palette>
```

## Feature Examples

### Built-in palettes

```html
<mona-color-palette [(value)]="color" palette="material"></mona-color-palette>
```

| `palette` value | Scheme |
|---|---|
| `"flat"` | A flat/muted color set (the default fallback when a custom palette is empty). |
| `"material"` | Material Design color set. |
| `"websafe"` | The 216-color web-safe palette. |

### Custom palettes

Pass any iterable of CSS color strings. `columns` controls the grid width and only applies to custom palettes — built-in schemes define their own column count.

```html
<mona-color-palette [(value)]="color" [palette]="brandColors" [columns]="6"></mona-color-palette>
```

```typescript
protected readonly brandColors = ["#1a1a2e", "#16213e", "#0f3460", "#e94560"];
```

An empty custom palette (`[]`) falls back to the built-in `"flat"` scheme.

### Rounded tile variants

```html
<mona-color-palette [(value)]="color" rounded="full"></mona-color-palette>
```

Supported `rounded` values are `none`, `small`, `medium`, `large`, and `full`.

### Read-only and disabled

```html
<mona-color-palette [(value)]="color" [readonly]="true"></mona-color-palette>
<mona-color-palette [(value)]="color" [disabled]="true"></mona-color-palette>
```

`readonly` keeps tiles focusable and keyboard-navigable but blocks selection changes. `disabled` removes tiles from the tab order and blocks all interaction.

## Value Behavior

Selecting the currently selected color deselects it, setting `value` back to `null`. Clicking or activating any other tile sets `value` to that tile's color string.

## Keyboard Interaction

Keyboard navigation targets the currently focused tile and is disabled entirely when `disabled` is `true`.

| Key | Action |
|---|---|
| `ArrowLeft` | Move focus one tile left (stops at the first tile). |
| `ArrowRight` | Move focus one tile right (stops at the last tile). |
| `ArrowUp` | Move focus one row up (stops at the first tile). |
| `ArrowDown` | Move focus one row down (stops at the last tile). |
| `Home` | Move focus to the first tile. |
| `End` | Move focus to the last tile. |
| `Enter` / `Space` | Select the focused tile. Ignored when `readonly` is `true` (focus still moves normally). |

## Accessibility Notes

The host renders `role="grid"`. Each visual row is wrapped in an element with `role="row"`, and each swatch renders `role="gridcell"` with a roving `tabindex` (only the active tile is tab-reachable; arrow keys move both focus and the active tile).

| Attribute | Where | Value |
|---|---|---|
| `role` | Host | `"grid"` |
| `aria-label` | Host | `"Color palette"` (fixed, not configurable) |
| `aria-disabled` | Host | Reflects `disabled` |
| `aria-invalid` | Host | `"true"` when invalid, otherwise absent |
| `aria-readonly` | Host | Reflects `readonly` |
| `aria-required` | Host | Reflects `required` |
| `role` | Each tile | `"gridcell"` |
| `aria-label` | Each tile | `"Color " + <color value>` |
| `aria-selected` | Each tile | `"true"` when the tile matches `value` |
| `aria-disabled` / `aria-readonly` | Each tile | Reflect the corresponding host inputs |
| `tabindex` | Each tile | `0` for the active tile, `-1` for the rest, `-1` for all tiles when `disabled` |

**Consumer responsibilities**

- The host's accessible name is fixed to the literal text `"Color palette"` and is not exposed through a public input. If a page shows multiple color pickers or palettes, screen reader users cannot distinguish between them by name alone; surround the component with labeled context (e.g. a preceding heading or `<label>`) until an `aria-label` input is available.
- When using signal forms, bind through `[formField]` so the form field receives `value` and listens to `touch`.

## Forms Integration

`ColorPaletteComponent` implements `FormValueControl<string | null>` from `@angular/forms/signals`.

```typescript
import { disabled, form } from "@angular/forms/signals";

protected readonly form = form({ color: "#3498db" }, schema => {
    disabled(schema.color, { when: () => this.locked() });
});
```

```html
<mona-color-palette [formField]="form.color"></mona-color-palette>
```

The `touch` output fires when a tile loses focus or a color is selected. The signal forms `FormField` directive listens to this output to mark the field as touched.

## API

### `ColorPaletteComponent`

**Selector:** `mona-color-palette`

Implements `FormValueControl<string | null>` from `@angular/forms/signals`.

#### Inputs

| Name | Type | Default | Description |
|---|---|---|---|
| `columns` | `number` | `10` | Number of columns in the grid. Only applies to a custom `palette` array — built-in schemes define their own column count. |
| `disabled` | `boolean` | `false` | Renders the component with reduced visual emphasis and removes pointer interaction. |
| `invalid` | `boolean` | `false` | Marks the color palette as invalid. When bound via `[formField]`, this is written by the `FormField` directive. |
| `palette` | `"flat" \| "material" \| "websafe" \| Iterable<string>` | `[]` | The palette to display — a built-in scheme name, or a custom iterable of CSS color strings. An empty custom palette falls back to `"flat"`. |
| `readonly` | `boolean` | `false` | Prevents value changes while preserving the component's visual state. When bound via `[formField]`, this is written by the `FormField` directive. |
| `required` | `boolean` | `false` | Marks the color palette as required. When bound via `[formField]`, this is written by the `FormField` directive. |
| `rounded` | `"none" \| "small" \| "medium" \| "large" \| "full"` | `"none"` | Border-radius preset applied to each color tile. |
| `tileSize` | `number` | `18` | Size, in pixels, of each square tile. |
| `touched` | `boolean` | `false` | Marks the color palette as touched. When bound via `[formField]`, this is written by the `FormField` directive. |
| `value` | `string \| null` | `null` | Two-way bindable current color value. Implements `FormValueControl<string \| null>`, enabling the signal forms `[formField]` binding. |

#### Outputs

| Name | Type | Description |
|---|---|---|
| `touch` | `void` | Emitted when a tile loses focus or a color is selected. Consumed by the signal forms `FormField` directive to mark the field as touched. |

### Exported Types

| Name | Shape | Description |
|---|---|---|
| `PaletteType` | `"flat" \| "material" \| "websafe"` | The built-in scheme names accepted by `palette`. |
| `ColorScheme` | `{ colors: string[]; columns: number; name: string }` | Shape of a color scheme. Not consumed directly by any public input — useful for typing custom scheme data alongside the component. |
| `ColorPaletteVariantProps` / `ColorPaletteVariantInput` | — | Variant prop types backing the `rounded` input's literal union, exported for advanced typing scenarios. |

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source (color-palette.component.ts) and component-metadata.json
- [x] Basic examples use public imports from mona-ui
- [x] Signal forms support verified against FormValueControl implementation and specs
- [x] ControlValueAccessor absence documented
- [x] Keyboard map verified against onKeyDown() implementation and specs
- [x] ARIA attributes verified against color-palette.component.html (role=grid/row/gridcell, aria-* bindings)
- [x] Fixed aria-label limitation verified against host binding (static "'Color palette'" literal, no input)
- [x] Inputs and outputs tables sorted A-Z within each section
- [x] No private methods, internal signals, Tailwind utility classes, or implementation-only DOM/data-* details exposed
- [x] Exported PaletteType/ColorScheme/variant types verified present in lib/index.ts and dist d.ts
-->
