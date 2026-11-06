## Overview

`BreadcrumbComponent` renders a navigation landmark containing an ordered list of items defined by projected `<mona-breadcrumb-item>` children. The last item is automatically treated as the current page — it renders as non-interactive text with `aria-current="page"`. All other items are buttons, or real links when you project an anchor with `monaBreadcrumbLink`.

Separators between items default to a `ChevronRight` icon and are hidden from assistive technology. Replace the default by projecting an `<ng-template monaBreadcrumbSeparatorTemplate>` anywhere inside `<mona-breadcrumb>`.

**Use the breadcrumb when you need to:**

- Show the user's position in a multi-level hierarchy (settings pages, file explorers, e-commerce categories)
- Provide clickable navigation to parent levels alongside the current page label
- Mark completed steps in a wizard flow where each step corresponds to a navigated level

**Do not use when:**

- The navigation is flat with no hierarchy — use tabs or a nav bar instead
- Only a single item would be shown — a single-item breadcrumb adds no navigational value

## Import & Basic Usage

```typescript
import { BreadcrumbComponent, BreadcrumbItemComponent } from "@nanahoshi/mona-ui/breadcrumb";
// Optional: only needed for items that are links
import { BreadcrumbLinkDirective } from "@nanahoshi/mona-ui/breadcrumb";
// Optional: only needed when providing a custom separator
import { BreadcrumbSeparatorTemplateDirective } from "@nanahoshi/mona-ui/breadcrumb";
```

Add the imported symbols to your standalone component's `imports` array.

**Links (use these when an item goes to a page):**

```html

<mona-breadcrumb>
    <mona-breadcrumb-item><a monaBreadcrumbLink routerLink="/">Home</a></mona-breadcrumb-item>
    <mona-breadcrumb-item><a monaBreadcrumbLink routerLink="/products">Products</a></mona-breadcrumb-item>
    <mona-breadcrumb-item>Wireless Headphones</mona-breadcrumb-item>
</mona-breadcrumb>
```

The anchor is yours, so `href`, `routerLink`, `target` and `rel` all work, and so do ctrl-click, middle-click and "copy link". The item renders no button around it. A plain `<a>` without `monaBreadcrumbLink` would end up inside a button, which is invalid and fails axe. The last item can be a link too, and the `aria-current` goes on the anchor.

**Buttons, for an action that isn't navigation:**

```html

<mona-breadcrumb>
    <mona-breadcrumb-item (itemClick)="navigate('home')">Home</mona-breadcrumb-item>
    <mona-breadcrumb-item (itemClick)="navigate('products')">Products</mona-breadcrumb-item>
    <mona-breadcrumb-item>Wireless Headphones</mona-breadcrumb-item>
</mona-breadcrumb>
```

The last `<mona-breadcrumb-item>` never emits `itemClick` — it is non-interactive regardless of whether you bind the output. Only non-last items are clickable. When a trail stops before the page you're on, set `[lastItemCurrent]="false"` and the last item becomes a normal one, with no `aria-current`.

**Long trails:** items shrink and truncate with an ellipsis as the space runs out, and the other items give up their width before the current page does. To shorten the trail instead, set `maxItems`. The first and last items always stay, and the middle collapses behind a button that shows it again and moves focus to the first item it revealed. The trail collapses again when its items change.

```html

<mona-breadcrumb [maxItems]="4">...</mona-breadcrumb>
```

Truncation needs text to work on. An item whose content is its own flex container, such as `<div class="flex">`, gets clipped without the ellipsis.

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

The separator template receives `{ $implicit: number }` context — the zero-based index of the preceding item. After the collapse button, it's the index of the last hidden item:

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

> **Multiple breadcrumbs on the same page:** Set a unique `aria-label` on each `<mona-breadcrumb>` so screen reader users can distinguish the navigation landmarks.

## Appearance & Styling

### Visual states

| State                 | Appearance                                                                      |
|-----------------------|---------------------------------------------------------------------------------|
| Default item          | Muted text; hovering applies the foreground color and a hover background        |
| Focus-visible item    | A solid outline in the focus color, inside the item's edge                      |
| Individually disabled | Disabled text color, no pointer interaction                                     |
| List-level disabled   | The entire breadcrumb list uses the disabled text color, no pointer interaction |
| Current (last) item   | Medium font weight, foreground color, default cursor                            |

When the breadcrumb is disabled via `[disabled]="true"`, all items lose pointer interaction. When only a child item's `disabled` is `true`, only that item is visually dimmed (provided the parent is not also disabled).

### Custom classes

Add extra styles to the breadcrumb list via the `class` input on `<mona-breadcrumb>`:

```html

<mona-breadcrumb class="text-sm gap-2">...</mona-breadcrumb>
```

## Accessibility Notes

`BreadcrumbComponent` renders `role="navigation"` on the host, making it a landmark that screen reader users can navigate to directly. The `aria-label` input sets the landmark's accessible name — its default value is `"Breadcrumb"`. A breadcrumb with no items renders no landmark and no list.

The item list is announced as a list by assistive technology. The last item automatically receives `aria-current="page"`. Separators are hidden from assistive technology.

Items are native buttons, or the anchors you project. A disabled item is removed from the tab order and cannot be activated by keyboard or pointer. A disabled link gets `aria-disabled` and `tabindex="-1"`, and a click on it stops before `routerLink` sees it.

When multiple breadcrumbs appear on the same page, each should have a distinct `aria-label` so screen reader users can distinguish the landmarks.

## API

### `BreadcrumbComponent`

**Selector:** `mona-breadcrumb`

**Content projection:** accepts `<mona-breadcrumb-item>` children and an optional `<ng-template monaBreadcrumbSeparatorTemplate>`.

#### Inputs

| Name         | Type      | Default        | Description                                                                                                                   |
|--------------|-----------|----------------|-------------------------------------------------------------------------------------------------------------------------------|
| `aria-label` | `string`  | `'Breadcrumb'` | Accessible name for the breadcrumb navigation landmark. Override when multiple breadcrumb components appear on the same page. |
| `class`      | `string`  | `''`           | Additional CSS classes merged onto the breadcrumb list via `tailwind-merge`.                                                  |
| `disabled`   | `boolean` | `false`        | Renders the entire breadcrumb with reduced visual emphasis and removes pointer interaction from all items.                    |
| `lastItemCurrent` | `boolean` | `true`    | Treats the last item as the current page. Turn it off for a trail that ends before the page you're on.                        |
| `maxItems`   | `number \| null` | `null`  | The most items to show before the middle of the trail collapses. The first and last always stay, so anything below 2 counts as 2. |

`BreadcrumbComponent` has no event outputs.

---

### `BreadcrumbItemComponent`

**Selector:** `mona-breadcrumb-item`

Use as a direct child of `<mona-breadcrumb>`. Project any Angular content — text, icons, or elements — into the default slot.

#### Inputs

| Name       | Type      | Default | Description                                                                                                                                       |
|------------|-----------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| `disabled` | `boolean` | `false` | Renders this item with reduced visual emphasis and removes pointer interaction. Has no visual effect when the parent breadcrumb is also disabled. |

#### Outputs

| Name        | Type         | Description                                                                                                                                                                       |
|-------------|--------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `itemClick` | `MouseEvent` | Emitted with the click when the item's button or link is clicked or activated by keyboard. Never emitted for the current page or when the item is disabled. |

---

### `BreadcrumbLinkDirective`

**Selector:** `a[monaBreadcrumbLink]`

Put this on an anchor projected into a `<mona-breadcrumb-item>`. It styles the anchor, makes it the item, and applies the item's current and disabled states.

#### Inputs

| Name    | Type     | Default | Description                                                     |
|---------|----------|---------|-----------------------------------------------------------------|
| `class` | `string` | `''`    | Additional CSS classes merged onto the link via `tailwind-merge`. |

---

### `BreadcrumbSeparatorTemplateDirective`

**Selector:** `ng-template[monaBreadcrumbSeparatorTemplate]`

Apply to an `<ng-template>` directly inside `<mona-breadcrumb>` to replace the default `ChevronRight` separator. One directive per breadcrumb — the first match is used.

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
- [x] Basic examples compile against the public API surface
- [x] No internal or unexported APIs exposed (BreadcrumbItemDirective absent from index.ts; correctly omitted)
- [x] Accessibility claims verified against source: role="navigation" and aria-label in BreadcrumbComponent host; aria-current="page" in template; role="list" on <ol>; native disabled attribute drives disabled-item state; Enter/Space handled natively by button elements; axe runs in breadcrumb-behavior.spec.ts
- [x] Styling section documents only public customization points — Tailwind utility class names removed, replaced with consumer-facing descriptions
-->
