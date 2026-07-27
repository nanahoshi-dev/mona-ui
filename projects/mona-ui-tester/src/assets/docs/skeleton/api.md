## Overview & Usage Guidelines

Use `SkeletonComponent` to reserve space for content while it loads. It renders a non-interactive placeholder surface with a subtle pulse animation that respects the user's motion preferences.

The component has no projected content, model inputs, or event outputs. It is a decorative visual only; the region that contains it should communicate loading state to assistive technology when needed.

## Import & Basic Usage

```typescript
import { Component } from "@angular/core";
import { SkeletonComponent } from "@nanahoshi/mona-ui/skeleton";
```

Add `SkeletonComponent` to the `imports` array of a standalone component:

```typescript
@Component({
    imports: [SkeletonComponent],
    template: `
        <mona-skeleton width="12rem" height="1.25rem"></mona-skeleton>
    `
})
export class ProfileHeaderComponent {}
```

Numbers passed to `width` or `height` are interpreted as pixels. Strings can contain any CSS length accepted by the host element, such as `"12rem"`, `"240px"`, or `"100%"`.

## Examples

**Loading card layout:**

```html
<section aria-busy="true" aria-label="Loading profile">
    <mona-skeleton width="8rem" height="8rem" rounded="full"></mona-skeleton>
    <mona-skeleton width="12rem" height="1.25rem" class="mt-4"></mona-skeleton>
    <mona-skeleton width="100%" height="1rem" class="mt-2"></mona-skeleton>
</section>
```

**Pixel dimensions:**

```html
<mona-skeleton [width]="320" [height]="64"></mona-skeleton>
```

## Appearance & Styling

### Rounded presets

| `rounded` | Shape |
|-----------|-------|
| `none`    | No rounding |
| `small`   | Slight rounding |
| `medium`  | Moderate rounding (default) |
| `large`   | Strong rounding |
| `full`    | Fully rounded |

Use the public `class` input to add classes or other consumer styling to the host element. Classes are merged with the component's generated classes through `tailwind-merge`.

## Accessibility Notes

The skeleton host always has `aria-hidden="true"` because the placeholder itself is decorative and does not convey content. Mark the surrounding loading region with `aria-busy="true"` and give that region an accessible name or description when the loading state needs to be announced.

When loading completes, remove the busy state and replace the skeleton with the actual content. The component does not provide a live region or loading announcement.

## API Matrix

### `SkeletonComponent`

**Selector:** `mona-skeleton`

#### Inputs

| Name      | Type                              | Default    | Description |
|-----------|-----------------------------------|------------|-------------|
| `class`   | `string`                          | `''`       | Additional CSS classes merged onto the host element. |
| `height`  | `string \| number`                | `'1rem'`   | Height of the placeholder. Numbers are treated as pixels. |
| `rounded` | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` | Border-radius preset applied to the placeholder. |
| `width`   | `string \| number`                | `'100%'`   | Width of the placeholder. Numbers are treated as pixels. |

`SkeletonComponent` has no model inputs and no event outputs.

---

<!-- verification-checklist
- [x] Selector, inputs, defaults, and descriptions verified against skeleton.component.ts
- [x] Public import uses the published skeleton secondary entry point
- [x] Accessibility notes verified against the component's aria-hidden host binding and source JSDoc
- [x] Examples use only public component inputs
-->
