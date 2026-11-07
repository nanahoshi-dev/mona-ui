## Overview

Use `ColorPaletteComponent` when the user should choose only from a known, bounded set of colors rather than compose an arbitrary one. Use `ColorGradientComponent` when the user needs to choose a custom color. Use `ColorPickerComponent` when the palette (or gradient) editor should open from a compact dropdown-style control instead of being shown inline.

> **Forms.** `ColorPaletteComponent` implements `FormValueControl<string | null>` from `@angular/forms/signals`, so use `[formField]` with signal forms. It has no `ControlValueAccessor`, but `[(ngModel)]`, `[formControl]` and `formControlName` work too, because Angular binds a control's `value` and `touch` directly when it has no accessor.

## Import & Quick Start

```typescript
import { ColorPaletteComponent } from "@nanahoshi/mona-ui/color-palette";
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
import { signal } from "@angular/core";
import { FormField, form } from "@angular/forms/signals";
import { ColorPaletteComponent } from "@nanahoshi/mona-ui/color-palette";

protected readonly form = form(signal<{ color: string | null }>({ color: "#3498db" }));
```

```html
<mona-color-palette [formField]="form.color"></mona-color-palette>
```

## Examples

### Built-in palettes

```example
color-palette/built-in
```

| `palette` value | Scheme |
|---|---|
| `"flat"` | A flat/muted color set (the default fallback when a custom palette is empty). |
| `"material"` | Material Design color set. |
| `"websafe"` | The 216-color web-safe palette. |

### Custom palettes

Pass any iterable of CSS color strings. `columns` controls the grid width and only applies to custom palettes — built-in schemes define their own column count.

```example
color-palette/custom
```

An empty custom palette (`[]`) falls back to the built-in `"flat"` scheme. A `columns` value below 1 shows one column.

Hex, `rgb()` and `hsl()` colors are read from their text. Anything else, such as a color name, is read through a canvas, one for each tile, so prefer those three for a large palette.

### Named colors

Use `{ color, name }` items when the colors mean something. Assistive technology reads "Done, #15803d", and the same text shows as a tooltip. Plain strings and items can be mixed, and `value` always holds the color. `ColorPaletteItem` is imported from `@nanahoshi/mona-ui/common`.

```example
color-palette/named
```

### Read-only and disabled

```html
<mona-color-palette [(value)]="color" [readonly]="true"></mona-color-palette>
<mona-color-palette [(value)]="color" [disabled]="true"></mona-color-palette>
```

`readonly` keeps tiles focusable and keyboard-navigable but blocks selection changes. `disabled` removes tiles from the tab order and blocks all interaction.

## Appearance & Styling

### Rounded tile variants

```html
<mona-color-palette [(value)]="color" rounded="full"></mona-color-palette>
```

Supported `rounded` values are `none`, `small`, `medium`, `large`, and `full`.

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

Under `dir="rtl"`, `ArrowLeft` and `ArrowRight` swap, so each moves in the direction it points.

## Accessibility Notes

The host renders `role="grid"`. Each visual row is wrapped in an element with `role="row"`, and each swatch renders `role="gridcell"` with a roving `tabindex`: only the active tile is tab-reachable, and arrow keys move both focus and the active tile. Before any tile has focus, and again after focus leaves, the active tile is the selected one, or the first.

| Attribute | Where | Value |
|---|---|---|
| `role` | Host | `"grid"` |
| `aria-label` | Host | The `aria-label` input, or `"Color palette"`. Absent when a label or `aria-labelledby` names the palette. |
| `aria-disabled` | Host | Reflects `disabled` |
| `aria-invalid` | Host | `"true"` once `touched` and either `invalid`, or `required` with no color. Otherwise absent. |
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
import { signal } from "@angular/core";
import { FormField, disabled, form } from "@angular/forms/signals";

protected readonly form = form(signal<{ color: string | null }>({ color: "#3498db" }), schema => {
    disabled(schema.color, { when: () => this.locked() });
});
```

```html
<mona-color-palette [formField]="form.color"></mona-color-palette>
```

The `touch` output fires when focus leaves the palette or a color is selected. Moving between tiles doesn't fire it. The signal forms `FormField` directive listens to this output to mark the field as touched.

<!-- verification-checklist
- [x] API definitions and defaults verified against source (color-palette.component.ts)
- [x] Basic examples use public imports from @nanahoshi/mona-ui/color-palette
- [x] Signal forms support verified against FormValueControl implementation and specs
- [x] ControlValueAccessor absence documented, and the custom-control path verified in @angular/forms 22 (NgControl.ngControlCreate)
- [x] Keyboard map verified against onKeyDown() implementation and specs
- [x] ARIA attributes verified against color-palette.component.html (role=grid/row/gridcell, aria-* bindings)
- [x] aria-label input verified against host binding
- [x] Inputs and outputs tables sorted A-Z within each section
- [x] No private methods, internal signals, Tailwind utility classes, or implementation-only DOM/data-* details exposed
- [x] Exported types verified against the color-palette and common public-api.ts
-->
