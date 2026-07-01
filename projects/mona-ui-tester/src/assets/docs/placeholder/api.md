## Overview & Usage Guidelines

`PlaceholderComponent` fills its parent container and centers its content. It has two display modes:

- **Text mode** — set the `text` input to render a muted, uppercase label inside a `<span>`.
- **Projected content mode** — project any content when `text` is empty.

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

## Public Customization

The `text` label renders in a muted theme color and in uppercase. It is not interactive and is not announced as a heading.

Pass additional Tailwind or custom classes to the host element via the `class` input. They are merged with the component's base classes using `tailwind-merge`, so consumer classes can override the defaults predictably:

```html
<!-- Give the placeholder its own height rather than relying on a parent wrapper -->
<mona-placeholder text="Empty" class="h-40 border border-dashed border-border rounded-md">
</mona-placeholder>
```

`PlaceholderComponent` does not expose a label template or other structural customization point. To render anything beyond a single text label, use projected content mode instead of the `text` input.

## Examples

**Reserving space for a loading region:**

```html
<mona-placeholder text="Loading..." class="h-40"></mona-placeholder>
```

## Accessibility Notes

`PlaceholderComponent` does not render any ARIA roles or attributes, and the text label is not focusable. It is appropriate for static, non-urgent presentational content.

If the placeholder communicates a state change that screen reader users must be notified of (for example, swapping from a loading placeholder to "No results"), the consumer is responsible for adding an appropriate live region (such as `aria-live`) around the placeholder, since the component does not provide one.

## API Matrix

### `PlaceholderComponent`

**Selector:** `mona-placeholder`

#### Inputs

| Name    | Type     | Default | Description |
|---------|----------|---------|-------------|
| `class` | `string` | `''`    | Additional CSS classes merged onto the host element via `tailwind-merge`. |
| `text`  | `string` | `''`    | Text displayed as an uppercase muted label inside the placeholder. When non-empty, projected content is suppressed. |

`PlaceholderComponent` has no model inputs and no event outputs.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] Basic example compiles successfully
- [x] No internal or unexported APIs exposed
- [x] Accessibility claims verified against source (no ARIA roles/attributes rendered)
- [x] Styling section includes only public customization points (class merging); internal Tailwind/CVA class names removed
-->
