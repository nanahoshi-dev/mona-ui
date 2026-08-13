## Overview

`RatingComponent` lets users choose a numeric value from a visual scale of items. The component renders a focusable `role="slider"` control; preset icons or custom item visuals are decorative layers driven by the accessible value. Selected and hovered visuals use the primary theme color unless `color` is set.

**Import path:**

```typescript
import {
    RatingComponent,
    RatingItemTemplateDirective,
    RatingSelectedItemTemplateDirective,
    RatingHoveredItemTemplateDirective,
    type RatingIconName
} from "@nanahoshi/mona-ui/rating";
```

## Value Model

`value` is a two-way model (`model<number>`). The canonical range is `0` through `itemsCount`:

- `0` — no rating selected.
- `1` — the first item.
- `itemsCount` — the maximum rating.
- With `precision="half"`, half values such as `0.5` and `3.5` are valid.

```html
<mona-rating aria-label="Product rating" [(value)]="rating"></mona-rating>
```

External values that are out of range, non-finite, or incompatible with the active precision are normalized for rendering but are **never rewritten on the model** — the model changes only when the user interacts with the control. `Home` restores `0`.

## Inputs

All inputs are listed alphabetically.

| Input              | Type                                                   | Default        | Description                                                                                |
| ------------------ | ------------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------ |
| `aria-describedby` | `string \| null`                                       | `null`         | Associates help text or an error description with the rating control.                      |
| `aria-label`       | `string \| null`                                       | `null`         | Explicit accessible name.                                                                  |
| `aria-labelledby`  | `string \| null`                                       | `null`         | IDs of external elements providing the accessible name.                                    |
| `ariaValueText`    | `((value: number, maximum: number) => string) \| null` | `null`         | Custom screen-reader value announcement.                                                   |
| `class`            | `string`                                               | `""`           | Additional host classes merged through `tailwind-merge`.                                   |
| `color`            | `string \| null \| undefined`                          | `null`         | CSS color for selected and hovered visuals; empty values use the primary theme color.      |
| `disabled`         | `boolean`                                              | `false`        | Disables interaction and removes the control from the tab sequence.                        |
| `icon`             | `RatingIconName`                                       | `"star"`       | Built-in icon for the default visuals: `star`, `heart`, `circle`, `diamond`, or `flame`.   |
| `invalid`          | `boolean`                                              | `false`        | Signal Forms validation state. Error styling requires `touched` too.                       |
| `itemsCount`       | `number`                                               | `5`            | Number of rating items. Fractional values are floored, values below one are raised to one. |
| `label`            | `string \| null`                                       | `null`         | Optional visible label.                                                                    |
| `labelPosition`    | `"before" \| "after"`                                  | `"after"`      | Places the label before or after the item group.                                           |
| `precision`        | `"item" \| "half"`                                     | `"item"`       | Whole-item or half-item selection.                                                         |
| `readonly`         | `boolean`                                              | `false`        | Prevents value changes while preserving focusability and visual emphasis.                  |
| `selection`        | `"continuous" \| "single"`                             | `"continuous"` | Cumulative or single-item filling.                                                         |
| `size`             | `"small" \| "medium" \| "large"`                       | `"medium"`     | Icon dimensions, item hitboxes, spacing, and label typography.                             |
| `tabindex`         | `number`                                               | `0`            | Tab index applied when not disabled. Numeric strings are converted.                        |
| `touched`          | `boolean`                                              | `false`        | Signal Forms touched state.                                                                |
| `value`            | `number`                                               | `0`            | Current rating value (two-way model).                                                      |

## Outputs

| Output        | Type     | Description                                                                              |
| ------------- | -------- | ---------------------------------------------------------------------------------------- |
| `valueChange` | `number` | Emitted when the user selects a new value. Provided automatically by the `value` model.  |
| `touch`       | `void`   | Emitted when the user interacts with or blurs the control, marking the field as touched. |

## Methods

| Method                          | Description                                                    |
| ------------------------------- | -------------------------------------------------------------- |
| `focus(options?: FocusOptions)` | Focuses the inner slider control. Does nothing while disabled. |
| `blur()`                        | Blurs the inner slider control if focused.                     |

## Selection Behavior

With `selection="continuous"` (default), every item at or below the selected value fills; one boundary item may fill partially:

| Value | Precision | Visual result                              |
| ----: | --------- | ------------------------------------------ |
|   `0` | item      | No items filled                            |
|   `3` | item      | First three items filled                   |
| `3.5` | half      | First three items full, fourth half-filled |

With `selection="single"`, only the item representing the value fills:

| Value | Precision | Visual result                    |
| ----: | --------- | -------------------------------- |
|   `3` | item      | Only the third item filled       |
| `3.5` | half      | Only the fourth item half-filled |

## Precision Behavior

- `precision="item"` — pointer interaction anywhere inside an item selects the whole item; the keyboard step is `1`.
- `precision="half"` — each item is divided into two pointer regions (first half selects `itemValue - 0.5`, second half selects `itemValue`); the keyboard step is `0.5`.

In RTL, the first _visual_ half (the right side) maps to the lower value.

## Keyboard Navigation

| Key                       | Action                                |
| ------------------------- | ------------------------------------- |
| `ArrowRight` / `ArrowUp`  | Increase by the active precision step |
| `ArrowLeft` / `ArrowDown` | Decrease by the active precision step |
| `Home`                    | Set value to `0`                      |
| `End`                     | Set value to `itemsCount`             |

Arrow meaning is not inverted in RTL. Handled keys call `preventDefault`; unrecognized keys are ignored.

## Disabled vs. Read-Only

- `disabled` — no pointer or keyboard interaction, not focusable (`tabindex="-1"`), `aria-disabled="true"`, disabled colors, and an unavailable cursor.
- `readonly` — no pointer or keyboard interaction but remains focusable, `aria-readonly="true"`, normal colors, no interactive cursor.

When both are `true`, disabled behavior takes precedence.

## Signal Forms

`mona-rating` implements `FormValueControl<number>` and works with the `Field` directive of Angular Signal Forms:

```typescript
import { form, signal } from "@angular/forms/signals";

interface ReviewModel {
    rating: number;
}

readonly #model = signal<ReviewModel>({ rating: 0 });

readonly reviewForm = form(this.#model);
```

```html
<mona-rating aria-label="Review rating" [formField]="reviewForm.rating"> </mona-rating>
```

The `Field` directive writes `disabled`, `invalid`, and `touched` state automatically. Error styling (`aria-invalid`, `data-invalid`, error ring) appears only when the field is both invalid and touched.

## Accessibility Attributes

The rating control is a focusable `role="slider"` element and **requires an accessible name**. Provide at least one of `label` (a visible label rendered next to the items), `aria-label`, or `aria-labelledby` — without one of these, assistive technology cannot announce the control.

The inner control exposes:

| Attribute                                          | Value                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------- |
| `role`                                             | `"slider"`                                                                |
| `tabindex`                                         | `0` (or `-1` when disabled)                                               |
| `aria-valuemin`                                    | `0`                                                                       |
| `aria-valuemax`                                    | `itemsCount`                                                              |
| `aria-valuenow`                                    | The normalized value                                                      |
| `aria-valuetext`                                   | `"Not rated"`, `"3.5 out of 5"`, etc., or a custom `ariaValueText` result |
| `aria-label` / `aria-labelledby`                   | The resolved accessible name                                              |
| `aria-describedby`                                 | Forwarded from the input                                                  |
| `aria-disabled` / `aria-readonly` / `aria-invalid` | Reflecting the current state                                              |

All item icons and templates are wrapped in `aria-hidden="true"` containers so screen readers announce the slider value, not the individual stars.

## Templates

Templates override the default preset visual for their state and may be mixed freely — each state independently falls back to the selected preset:

| Directive                        | Overrides                  | Rendered when                                    |
| -------------------------------- | -------------------------- | ------------------------------------------------ |
| `monaRatingItemTemplate`         | The unselected preset icon | Every item's base layer                          |
| `monaRatingSelectedItemTemplate` | The filled preset overlay  | The visible value comes from the committed value |
| `monaRatingHoveredItemTemplate`  | The filled preset overlay  | The visible value comes from pointer preview     |

```html
<mona-rating aria-label="Satisfaction" precision="half" [(value)]="value">
    <ng-template monaRatingItemTemplate let-index="index">
        <span class="rating-face rating-face-empty">{{ index + 1 }}</span>
    </ng-template>

    <ng-template monaRatingSelectedItemTemplate let-index="index" let-fill="fill">
        <span class="rating-face rating-face-selected">{{ index + 1 }}</span>
    </ng-template>

    <ng-template monaRatingHoveredItemTemplate let-index="index" let-fill="fill">
        <span class="rating-face rating-face-hovered">{{ index + 1 }}</span>
    </ng-template>
</mona-rating>
```

### Template Context

Every template receives a `RatingItemTemplateContext`:

| Property              | Type      | Description                                       |
| --------------------- | --------- | ------------------------------------------------- |
| `$implicit` / `index` | `number`  | Zero-based item index.                            |
| `itemValue`           | `number`  | One-based value represented by this item.         |
| `fill`                | `number`  | Visible fill amount between `0` and `1`.          |
| `selected`            | `boolean` | The visible state comes from the committed value. |
| `hovered`             | `boolean` | The visible state comes from pointer preview.     |

The component owns overlay width, overflow clipping, continuous vs. single behavior, and RTL clipping direction. Templates only define the visual contents of each layer — they never implement half clipping themselves.

## Icon Presets and Custom Visuals

Use `icon` to select one built-in shape. The default base icon stays outlined, while committed and pointer-preview values use the same shape filled with the rating color. It defaults to the primary theme color; set `color` to any CSS color value to override it:

```html
<mona-rating aria-label="Favorite level" icon="heart" color="#e11d48" [(value)]="value"> </mona-rating>
```

The available icon values are `star`, `heart`, `circle`, `diamond`, and `flame`. Set `color` to `null`, `undefined`, or an empty string to restore the primary theme color.

For any other icon or visual, use the item templates. Provide all three templates to replace every default layer; omitted templates continue to use the selected preset:

```html
<mona-rating aria-label="Favorite level" [(value)]="value">
    <ng-template monaRatingItemTemplate>
        <svg lucideHeart class="h-full w-full text-muted-foreground" fill="none"></svg>
    </ng-template>

    <ng-template monaRatingSelectedItemTemplate>
        <svg lucideHeart class="h-full w-full text-rose-500" fill="currentColor"></svg>
    </ng-template>

    <ng-template monaRatingHoveredItemTemplate>
        <svg lucideHeart class="h-full w-full text-rose-400" fill="currentColor"></svg>
    </ng-template>
</mona-rating>
```

Import `LucideHeart` from `@lucide/angular` alongside the Rating template directives in the consuming component.

## Styling and Class Extension

The host `class` input is merged with the component's classes through `tailwind-merge`, so compatible Tailwind utilities override the theme defaults.

## Programmatic Focus

```typescript
readonly rating = viewChild(RatingComponent);

this.rating()?.focus();
```

## Intentional Exclusions

The component intentionally does not support:

- `ngModel`, `formControl`, `formControlName`, Legacy Reactive Forms, or Template-driven Forms
- Drag-to-rate interaction
- Arbitrary minimum/maximum values
- Custom step values other than `1` and `0.5`
- Vertical orientation
- A clear/reset button
- Per-item disabled states
