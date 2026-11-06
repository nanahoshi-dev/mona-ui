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

An empty custom palette (`[]`) falls back to the built-in `"flat"` scheme. A `columns` value below 1 shows one column.

### Named colors

Use `{ color, name }` items when the colors mean something. Assistive technology reads "Brand blue, #1A73E8", and the same text shows as a tooltip. Plain strings and items can be mixed, and `value` always holds the color.

```typescript
protected readonly brandColors = [
    { color: "#1A73E8", name: "Brand blue" },
    { color: "#E94560", name: "Alert" },
    "#16213E"
];
```

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

Selecting the currently selected color deselects it, setting `value` back to `null`, unless `clearable` is `false` or the palette is required. Clicking or activating any other tile sets `value` to that tile's color string.

Two spellings of a color count as the same one when finding the selected tile, so `#abcdef`, `#ABCDEF` and `rgb(171, 205, 239)` all select the same tile. A repeated color marks only its first tile.

## Keyboard Interaction

Keyboard navigation targets the currently focused tile and is disabled entirely when `disabled` is `true`.

| Key | Action |
|---|---|
| `ArrowLeft` | Move focus one tile left (stops at the first tile). |
| `ArrowRight` | Move focus one tile right (stops at the last tile). |
| `ArrowUp` | Move focus one row up. Stays put on the first row. |
| `ArrowDown` | Move focus one row down. Stays put when there's no tile below. |
| `Home` | Move focus to the start of the row. |
| `End` | Move focus to the end of the row. |
| `Ctrl+Home` | Move focus to the first tile. |
| `Ctrl+End` | Move focus to the last tile. |
| `Enter` / `Space` | Select the focused tile. Ignored when `readonly` is `true` (focus still moves normally). |

## Accessibility Notes

The host renders `role="grid"`. Each visual row is wrapped in an element with `role="row"`, and each swatch renders `role="gridcell"` with a roving `tabindex`: only the active tile is tab-reachable, and arrow keys move both focus and the active tile. Before any tile has focus, and again after focus leaves, the active tile is the selected one, or the first.

| Attribute | Where | Value |
|---|---|---|
| `role` | Host | `"grid"` |
| `aria-label` | Host | The `aria-label` input, or `"Color palette"`. Absent when a label or `aria-labelledby` names the palette. |
| `aria-disabled` | Host | Reflects `disabled` |
| `aria-invalid` | Host | `"true"` when invalid, otherwise absent |
| `aria-readonly` | Host | Reflects `readonly` |
| `aria-required` | Host | Reflects `required` |
| `role` | Each tile | `"gridcell"` |
| `aria-label` | Each tile | `"Color " + <color value>`, or `<name>, <color value>` for a named item |
| `title` | Each tile | Same as `aria-label` |
| `aria-selected` | Each tile | `"true"` when the tile matches `value` |
| `aria-disabled` / `aria-readonly` | Each tile | Reflect the corresponding host inputs |
| `tabindex` | Each tile | `0` for the active tile, `-1` for the rest, `-1` for all tiles when `disabled` |

**Consumer responsibilities**

- Name each palette with `aria-label`, `aria-labelledby` or a `mona-label`, so screen reader users can tell them apart.
- Built-in palettes have no color names, so each tile reads its hex value. Use `{ color, name }` items where names matter.
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

The `touch` output fires when focus leaves the palette or a color is selected. Moving between tiles doesn't fire it. The signal forms `FormField` directive listens to this output to mark the field as touched.

## API

### `ColorPaletteComponent`

**Selector:** `mona-color-palette`

Implements `FormValueControl<string | null>` from `@angular/forms/signals`.

#### Inputs

| Name | Type | Default | Description |
|---|---|---|---|
| `aria-label` | `string` | `""` | Accessible name of the grid. |
| `aria-labelledby` | `string` | `""` | Id of the element that names the grid. |
| `clearable` | `boolean` | `true` | Whether activating the selected tile clears the value. A required palette never clears. |
| `columns` | `number` | `10` | Number of columns in the grid. Only applies to a custom `palette` array — built-in schemes define their own column count. A value below 1 shows one column. |
| `disabled` | `boolean` | `false` | Renders the component with reduced visual emphasis and removes pointer interaction. |
| `invalid` | `boolean` | `false` | Marks the color palette as invalid. When bound via `[formField]`, this is written by the `FormField` directive. |
| `palette` | `"flat" \| "material" \| "websafe" \| Iterable<string \| ColorPaletteItem>` | `[]` | The palette to display — a built-in scheme name, or a custom iterable of CSS color strings or `{ color, name }` items. An empty custom palette falls back to `"flat"`. |
| `readonly` | `boolean` | `false` | Prevents value changes while preserving the component's visual state. When bound via `[formField]`, this is written by the `FormField` directive. |
| `required` | `boolean` | `false` | Marks the color palette as required. When bound via `[formField]`, this is written by the `FormField` directive. |
| `rounded` | `"none" \| "small" \| "medium" \| "large" \| "full"` | `"none"` | Border-radius preset applied to each color tile. |
| `tileSize` | `number` | `24` | Size, in pixels, of each square tile. Below 24, tiles miss the minimum target size of WCAG 2.5.8. |
| `touched` | `boolean` | `false` | Marks the color palette as touched. When bound via `[formField]`, this is written by the `FormField` directive. |
| `value` | `string \| null` | `null` | Two-way bindable current color value. Implements `FormValueControl<string \| null>`, enabling the signal forms `[formField]` binding. |

#### Outputs

| Name | Type | Description |
|---|---|---|
| `colorSelect` | `string` | Emitted with the tile's color each time a tile is activated, also when it's already selected, which doesn't change `value`. |
| `touch` | `void` | Emitted when focus leaves the palette or a color is selected. Consumed by the signal forms `FormField` directive to mark the field as touched. |

### Exported Types

| Name | Shape | Description |
|---|---|---|
| `ColorPaletteItem` | `{ color: string; name?: string }` | A swatch with a name of its own. |
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
