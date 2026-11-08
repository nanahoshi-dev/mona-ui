## Overview

Use `SkeletonComponent` to reserve space for content while it loads. It renders a non-interactive placeholder surface with a subtle pulse animation that respects the user's motion preferences.

The component has no projected content, model inputs, or event outputs. It is a decorative visual only; the region that contains it should communicate loading state to assistive technology when needed.

## Import & Quick Start

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

Numbers passed to `width` or `height` are interpreted as pixels. Strings can contain any CSS length accepted by the host element, such as `"12rem"`, `"240px"`, or `"100%"`. Both are set as inline styles, so a class like `w-8` has no effect. Use these inputs.

## Examples

### Loading card

The card is marked `aria-busy` while it loads, and the skeleton is replaced with the content when it's done.

```example
skeleton/card
```

### List rows

Repeat a row of skeletons in the shape of the items that will load.

```example
skeleton/list
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

## Accessibility

The skeleton host always has `aria-hidden="true"` because the placeholder itself is decorative and does not convey content. Mark the surrounding loading region with `aria-busy="true"` and give that region an accessible name or description when the loading state needs to be announced.

When loading completes, remove the busy state and replace the skeleton with the actual content. The component does not provide a live region or loading announcement.

<!-- verification-checklist
- [x] Selector, inputs, defaults, and descriptions verified against skeleton.component.ts
- [x] Public import uses the published skeleton secondary entry point
- [x] Accessibility notes verified against the component's aria-hidden host binding and source JSDoc
- [x] Examples use only public component inputs
-->
