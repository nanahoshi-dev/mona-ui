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

## Clearing

The keyboard can always clear a rating with `Home`. Set `clearable` so a click on the current value clears it too, which gives pointer and touch users a way to undo one:

```html
<mona-rating aria-label="Product rating" clearable [(value)]="rating"></mona-rating>
```

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

In RTL, the first _visual_ half (the right side) maps to the lower value. The pointer follows the computed CSS `direction`, so a `direction` set by style alone counts.

## Keyboard Navigation

| Key                       | Action                                |
| ------------------------- | ------------------------------------- |
| `ArrowRight` / `ArrowUp`  | Increase by the active precision step |
| `ArrowLeft` / `ArrowDown` | Decrease by the active precision step |
| `PageUp`                  | Increase by `1`                       |
| `PageDown`                | Decrease by `1`                       |
| `Home`                    | Set value to `0`                      |
| `End`                     | Set value to `itemsCount`             |

In RTL, `ArrowLeft` increases and `ArrowRight` decreases. Handled keys call `preventDefault`; unrecognized keys are ignored.

## Disabled vs. Read-Only

- `disabled` — no pointer or keyboard interaction, not focusable (`tabindex="-1"`), `aria-disabled="true"`, disabled colors, and an unavailable cursor.
- `readonly` — no pointer or keyboard interaction but remains focusable, `aria-readonly="true"`, normal colors, no interactive cursor.

When both are `true`, disabled behavior takes precedence.

## Signal Forms

`mona-rating` implements `FormValueControl<number>` and works with the `FormField` directive of Angular Signal Forms:

```typescript
import { signal } from "@angular/core";
import { form, FormField, min } from "@angular/forms/signals";

interface ReviewModel {
    rating: number;
}

readonly #model = signal<ReviewModel>({ rating: 0 });

readonly reviewForm = form(this.#model, schema => {
    min(schema.rating, 1);
});
```

```html
<mona-rating aria-label="Review rating" [formField]="reviewForm.rating"> </mona-rating>
```

The `FormField` directive writes `disabled`, `invalid`, `readonly`, `required`, and `touched` state automatically. Don't set those on the same element, because Angular rejects the template. Error styling (`aria-invalid`, `data-invalid`, error ring) appears only when the field is both invalid and touched, or `required` and touched with a rating of `0`.

**Requiring a rating:** `required` and the signal forms `required` rule don't do the same thing. The `required` input shows the invalid state at `0` once touched. The `required` rule doesn't treat the number `0` as empty, so it won't fail the form by itself. To reject an unrated value, use `min(path, 1)`, or `min(path, 0.5)` with `precision="half"`.

The rating has no `name` input, because it has no native input.

`RatingComponent` doesn't implement `ControlValueAccessor`. `[(ngModel)]` binds to its `value` model through Angular's support for custom controls. Prefer `[formField]`.

## Accessibility Attributes

The rating control is a focusable `role="slider"` element and **requires an accessible name**. Provide at least one of `label` (a visible label rendered next to the items), `aria-label`, or `aria-labelledby`, wrap it in a `mona-label` with `text`, or bind a label to it with `[for]="ref"`. Without one of these, assistive technology cannot announce the control, and it warns in development. A click on a wrapping label's caption focuses the control.

The inner control exposes:

| Attribute                                          | Value                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------- |
| `role`                                             | `"slider"`                                                                |
| `tabindex`                                         | `tabindex` (or `-1` when disabled)                                        |
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

- `ControlValueAccessor`
- Drag-to-rate interaction
- Arbitrary minimum/maximum values
- Custom step values other than `1` and `0.5`
- Vertical orientation
- A clear/reset button (use `clearable` or `Home`)
- Per-item disabled states
