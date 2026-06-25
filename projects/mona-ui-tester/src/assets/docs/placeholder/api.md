## Overview

`PlaceholderComponent` fills its parent container (`w-full h-full`) and centers its content using flexbox. It has two display modes:

- **Text mode** — set the `text` input to render a styled, uppercase, muted label inside a `<span>`.
- **Projected content mode** — project any content via `<ng-content>` when `text` is empty.

When both are provided, `text` takes precedence and projected content is not rendered.

**Use `PlaceholderComponent` when you need to:**

- Signal an empty state inside a panel, card, or data region (e.g., "No results")
- Hold space for a content area that has not yet loaded
- Wrap a custom empty-state illustration or icon inside a consistently sized, centered slot

## Import & Basic Usage

```typescript
import { PlaceholderComponent } from "@mirei/mona-ui";
```

Add `PlaceholderComponent` to your standalone component's `imports` array.

**Text mode** — a muted, uppercase label:

```html
<div class="h-40 border border-border rounded-md">
    <mona-placeholder text="No items"></mona-placeholder>
</div>
```

**Projected content mode** — any content when `text` is empty:

```html
<div class="h-40 border border-border rounded-md">
    <mona-placeholder>
        <div class="flex flex-col items-center gap-2 text-muted-foreground">
            <svg lucideInbox [size]="32"></svg>
            <span>Nothing here yet</span>
        </div>
    </mona-placeholder>
</div>
```

**Conditional placeholder** — swap between placeholder and real content:

```html
@if (items().length > 0) {
    <app-item-list [items]="items()"></app-item-list>
} @else {
    <mona-placeholder text="No items"></mona-placeholder>
}
```

> **Sizing:** `PlaceholderComponent` fills its parent with `w-full h-full`. The parent element must have an explicit height for the placeholder to be visible. Setting height via a `class` on the parent or via the component's `class` input both work.

## Appearance & Styling

### Text mode styling

The `text` label is rendered in a `<span>` with `text-foreground opacity-50 uppercase select-none`. It is not interactive and is not announced as a heading.

### Custom class

Pass additional Tailwind or custom classes to the host element via the `class` attribute. They are merged via `tailwind-merge`:

```html
<!-- Give the placeholder its own height rather than relying on a parent wrapper -->
<mona-placeholder text="Empty" class="h-40 border border-dashed border-border rounded-md">
</mona-placeholder>
```

## API

### `PlaceholderComponent`

**Selector:** `mona-placeholder`

| Name    | Kind  | Type     | Default | Required | Description |
|---------|-------|----------|---------|----------|-------------|
| `class` | input | `string` | `''`    | Optional | Additional CSS classes merged onto the host element via `tailwind-merge`. |
| `text`  | input | `string` | `''`    | Optional | Text displayed as an uppercase muted label inside the placeholder. When non-empty, projected content is suppressed. |

`PlaceholderComponent` has no model inputs and no event outputs.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] @description and @default added to userClass
- [x] text priority over projected content verified in template source
- [x] w-full h-full sizing behavior verified in CVA base styles
- [x] No internal or unexported APIs exposed
-->

<!-- TODO(owner-review): The text label renders at opacity-50. Verify that the resolved contrast ratio of `color-mix(text-foreground at 50%)` against `--color-background` meets WCAG AA minimum (4.5:1) across all supported themes. -->
