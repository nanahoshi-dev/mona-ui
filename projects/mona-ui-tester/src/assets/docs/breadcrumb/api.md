## Overview

`BreadcrumbComponent` renders a `<nav>` landmark containing an ordered list of items defined by projected `<mona-breadcrumb-item>` children. The last item is automatically treated as the current page — it renders as non-interactive text with `aria-current="page"`. All other items are interactive and keyboard-operable via Enter and Space.

Separators between items default to a `ChevronRight` icon and are hidden from assistive technology. Replace the default by projecting an `<ng-template monaBreadcrumbSeparatorTemplate>` anywhere inside `<mona-breadcrumb>`.

**Use `BreadcrumbComponent` when you need to:**

- Show the user's position in a multi-level hierarchy (settings pages, file explorers, e-commerce categories)
- Provide clickable navigation to parent levels alongside the current page label
- Mark completed steps in a wizard flow where each step corresponds to a navigated level

**Do not use `BreadcrumbComponent` when:**

- The navigation is flat with no hierarchy — use tabs or a nav bar instead
- Only a single item would be shown — a single-item breadcrumb adds no navigational value

## Import & Basic Usage

```typescript
import { BreadcrumbComponent, BreadcrumbItemComponent } from "@mirei/mona-ui";
// Optional: only needed when providing a custom separator
import { BreadcrumbSeparatorTemplateDirective } from "@mirei/mona-ui";
```

Add the imported symbols to your standalone component's `imports` array.

**Basic breadcrumb:**

```html

<mona-breadcrumb>
    <mona-breadcrumb-item (itemClick)="navigate('home')">Home</mona-breadcrumb-item>
    <mona-breadcrumb-item (itemClick)="navigate('products')">Products</mona-breadcrumb-item>
    <mona-breadcrumb-item>Wireless Headphones</mona-breadcrumb-item>
</mona-breadcrumb>
```

The last `<mona-breadcrumb-item>` never emits `itemClick` — it is non-interactive regardless of whether you bind the output. Only non-last items are clickable.

**Custom separator:**

```html

<mona-breadcrumb>
    <mona-breadcrumb-item (itemClick)="go('home')">Home</mona-breadcrumb-item>
    <mona-breadcrumb-item>Settings</mona-breadcrumb-item>
    <ng-template monaBreadcrumbSeparatorTemplate>
        <svg lucideSlash [size]="14"></svg>
    </ng-template>
</mona-breadcrumb>
```

The separator template receives `{ $implicit: number }` context — the zero-based index of the preceding item:

```html

<ng-template monaBreadcrumbSeparatorTemplate let-i>
    <span>{{ i === 0 ? '›' : '/' }}</span>
</ng-template>
```

**Disabled states:**

```html
<!-- Disable the entire breadcrumb (e.g. while loading) -->
<mona-breadcrumb [disabled]="isLoading()">
    <mona-breadcrumb-item (itemClick)="go('home')">Home</mona-breadcrumb-item>
    <mona-breadcrumb-item>Current</mona-breadcrumb-item>
</mona-breadcrumb>

<!-- Disable one item without affecting others -->
<mona-breadcrumb>
    <mona-breadcrumb-item (itemClick)="go('home')">Home</mona-breadcrumb-item>
    <mona-breadcrumb-item [disabled]="true" (itemClick)="go('locked')">Locked</mona-breadcrumb-item>
    <mona-breadcrumb-item>Current</mona-breadcrumb-item>
</mona-breadcrumb>
```

> **Multiple breadcrumbs on the same page:** Set a unique `ariaLabel` on each `<mona-breadcrumb>` so screen reader users can distinguish the navigation landmarks.

## Appearance & Styling

### Visual states

| State                 | Applied styles                                                           |
|-----------------------|--------------------------------------------------------------------------|
| Default item          | `text-primary/70`; hover → `text-primary`                                |
| Focus-visible item    | `ring-2 ring-primary/40` focus ring                                      |
| Individually disabled | `opacity-50 cursor-not-allowed pointer-events-none` on that item         |
| List-level disabled   | `opacity-50 cursor-not-allowed pointer-events-none` on the entire `<ol>` |
| Current (last) item   | `font-medium text-primary cursor-default`                                |

When `BreadcrumbComponent.disabled` is `true`, the `<ol>` becomes fully non-interactive. When only a child item's `disabled` is `true`, only that item receives `opacity-50` (provided the list itself is not also disabled).

### Custom classes

Override the `<ol>` element's styles via the `class` input on `<mona-breadcrumb>`:

```html

<mona-breadcrumb class="text-sm gap-2">...</mona-breadcrumb>
```

## API

### `BreadcrumbComponent`

**Selector:** `mona-breadcrumb`

**Content projection:** accepts `<mona-breadcrumb-item>` children and an optional `<ng-template monaBreadcrumbSeparatorTemplate>`.

| Name        | Kind  | Type      | Default        | Required | Description                                                                                                                                                |
|-------------|-------|-----------|----------------|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ariaLabel` | input | `string`  | `'Breadcrumb'` | Optional | Accessible label for the `role="navigation"` landmark. Sets the host's `aria-label` attribute. Override when multiple breadcrumbs appear on the same page. |
| `class`     | input | `string`  | `''`           | Optional | Additional CSS classes merged onto the inner `<ol>` element via `tailwind-merge`.                                                                          |
| `disabled`  | input | `boolean` | `false`        | Optional | When `true`, the entire breadcrumb list becomes visually disabled and all items lose pointer interaction.                                                  |

`BreadcrumbComponent` has no event outputs.

---

### `BreadcrumbItemComponent`

**Selector:** `mona-breadcrumb-item`

Use as a direct child of `<mona-breadcrumb>`. Project any Angular content — text, icons, or elements — into the default slot. The component captures projected content into a template that the parent renders at the correct list position.

| Name        | Kind   | Type      | Default | Required | Description                                                                                                                                                                                          |
|-------------|--------|-----------|---------|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `disabled`  | input  | `boolean` | `false` | Optional | Disables this item. The item receives `aria-disabled="true"` and `tabindex="-1"`, and `itemClick` is suppressed. Has no visual effect when the parent `BreadcrumbComponent.disabled` is also `true`. |
| `itemClick` | output | `void`    | —       | Optional | Emitted when the item is clicked or activated via Enter or Space. Never emitted when this is the last item (current page) or when the item is disabled.                                              |

---

### `BreadcrumbSeparatorTemplateDirective`

**Selector:** `ng-template[monaBreadcrumbSeparatorTemplate]`

Apply to an `<ng-template>` directly inside `<mona-breadcrumb>` to replace the default `ChevronRight` icon. One directive per breadcrumb — the first match is used.

The template context is `{ $implicit: number }` where the implicit value is the zero-based index of the preceding item.

```html

<ng-template monaBreadcrumbSeparatorTemplate let-index>
    <svg lucideSlash [size]="14"></svg>
</ng-template>
```

`BreadcrumbSeparatorTemplateDirective` has no inputs or outputs.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] BreadcrumbItemDirective confirmed internal (absent from index.ts) — not documented
- [x] ariaLabel has no alias in source — documented as ariaLabel (not aria-label)
- [x] itemClick correctly marked as output (kind: "output" in metadata)
- [x] Basic examples compile against the public API surface
- [x] No internal or unexported APIs exposed
-->

<!-- TODO(owner-review): Confirm public package name is @mirei/mona-ui vs mona-ui -->
