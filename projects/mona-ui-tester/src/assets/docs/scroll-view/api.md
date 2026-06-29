## Overview

Use `ScrollViewComponent` when you need to display a sequence of items — images, cards, or content panels — and the user navigates between them one at a time within a fixed viewport. The component requires explicit `height` and `width` values and renders exactly one item per view.

> `ScrollViewComponent` is not a form control. It does not implement `ControlValueAccessor` or any signal forms interface.

## Import & Basic Usage

```typescript
import { ScrollViewComponent } from "@mirei/mona-ui";
```

A slide template projected inside `<mona-scroll-view>` is required. Without it, no content is rendered inside each slide.

```html
<mona-scroll-view [data]="images" width="640px" height="360px">
  <ng-template let-src>
    <img [src]="src" alt="" class="w-full h-full object-cover" />
  </ng-template>
</mona-scroll-view>
```

### Slide template context

Each slide renders the projected template with the following context variables:

| Variable | Type | Description |
|----------|------|-------------|
| `$implicit` (e.g., `let-item`) | `unknown` | The current data item from the `data` collection. |
| `width` | `number` | Width of the content area in pixels at render time. |
| `height` | `number` | Height of the content area in pixels at render time. |

```html
<mona-scroll-view [data]="panels" width="100%" height="400px">
  <ng-template let-panel let-w="width" let-h="height">
    <div [style.width.px]="w" [style.height.px]="h">{{ panel.title }}</div>
  </ng-template>
</mona-scroll-view>
```

## Feature Examples

### Navigation arrows

```html
<mona-scroll-view [data]="items" width="640px" height="360px" [arrows]="true">
  <ng-template let-item>{{ item }}</ng-template>
</mona-scroll-view>
```

In finite mode, the left arrow is hidden on the first page and the right arrow is hidden on the last page. In infinite mode, both arrows remain visible at all times.

### Dot pager

```html
<mona-scroll-view
  [data]="items"
  width="640px"
  height="360px"
  [pageable]="true"
  pagerOverlay="dark"
  pagerRounded="full">
  <ng-template let-item>{{ item }}</ng-template>
</mona-scroll-view>
```

When the number of dots exceeds the pager bar width, scroll arrows appear automatically on the pager bar to let the user scroll the dot list horizontally.

### Infinite loop

```html
<mona-scroll-view
  [data]="items"
  width="640px"
  height="360px"
  [infinite]="true"
  [arrows]="true">
  <ng-template let-item>{{ item }}</ng-template>
</mona-scroll-view>
```

In infinite mode, navigating past the last item wraps to the first, and navigating before the first wraps to the last.

### Two-way page binding

```typescript
protected currentPage = 0;
```

```html
<mona-scroll-view
  [data]="items"
  width="640px"
  height="360px"
  [(index)]="currentPage">
  <ng-template let-item>{{ item }}</ng-template>
</mona-scroll-view>
<p>Page {{ currentPage + 1 }} of {{ items.length }}</p>
```

`index` is a two-way model. Setting it programmatically navigates to that zero-based page index.

### Animation control

```html
<!-- Default 500 ms -->
<mona-scroll-view [data]="items" width="640px" height="360px" [animate]="true">
  <ng-template let-item>{{ item }}</ng-template>
</mona-scroll-view>

<!-- No animation -->
<mona-scroll-view [data]="items" width="640px" height="360px" [animate]="false">
  <ng-template let-item>{{ item }}</ng-template>
</mona-scroll-view>

<!-- Custom duration in milliseconds -->
<mona-scroll-view [data]="items" width="640px" height="360px" [animate]="250">
  <ng-template let-item>{{ item }}</ng-template>
</mona-scroll-view>
```

Users who enable `prefers-reduced-motion` in their OS settings will see animation duration reduced to 1 ms regardless of the configured value.

## Accessibility Notes

### ARIA roles and attributes

`ScrollViewComponent` manages the following attributes automatically:

**Host element**

| Attribute | Value |
|-----------|-------|
| `role` | `"region"` |
| `aria-roledescription` | `"carousel"` |
| `aria-label` | `"Page N of M"` — updated on every navigation |
| `tabindex` | `0` |

**Each slide**

| Attribute | Value |
|-----------|-------|
| `role` | `"group"` |
| `aria-roledescription` | `"slide"` |
| `aria-label` | `"N of M"` |

**Navigation arrow buttons**

Each arrow button carries a static `aria-label` of `"Previous page"` or `"Next page"`.

**Pager dot buttons**

Each pager dot carries `aria-label="Page N"` and `aria-current="true"` when it is the currently active page.

### Keyboard interaction

| Key | Action |
|-----|--------|
| `ArrowLeft` | Navigate to the previous page |
| `ArrowRight` | Navigate to the next page |

The host element must be focused before keyboard navigation is active. It receives focus via `tabindex="0"` and is part of the natural tab order.

### Consumer responsibilities

- The `aria-label` on the host reflects only the current page counter. If the carousel serves a specific purpose (e.g., "Featured products"), wrap it in a labelled landmark or place a visible heading adjacent to it.
- Slide content is consumer-controlled through the projected template. Provide appropriate accessible labels on projected content (e.g., `alt` on `<img>` elements).

## API

### `ScrollViewComponent`

**Selector:** `mona-scroll-view`

#### Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `animate` | `boolean \| number` | `true` | Controls slide transition animation. `true` uses the default 500 ms duration. `false` disables animation. A number sets a custom duration in milliseconds. |
| `arrows` | `boolean` | `false` | Shows previous/next navigation arrows on the left and right edges. In finite mode, the left arrow is hidden on the first page and the right arrow is hidden on the last page. |
| `class` | `string` | `""` | Additional CSS classes merged onto the host element via `tailwind-merge`. |
| `data` | `Iterable<unknown>` | `[]` | The collection of items to display. Each item is passed as the implicit variable to the slide template. |
| `height` | `string \| number` | — | **Required.** Height of the scroll view. Accepts a CSS string (e.g., `"360px"`) or a unitless number. |
| `index` | `number` | `0` | Two-way bindable. Zero-based index of the currently active page. |
| `infinite` | `boolean` | `false` | When `true`, navigating past the last item wraps to the first, and vice versa. |
| `pageable` | `boolean` | `false` | Shows a row of dot buttons representing each page at the bottom of the component. |
| `pagerBlur` | `number` | `3` | Backdrop blur in pixels applied to the pager overlay strip. Has no visual effect when `pagerOverlay` is `"none"`. |
| `pagerOverlay` | `'dark' \| 'light' \| 'none'` | `"dark"` | Background style of the pager strip. `"dark"` and `"light"` apply a semi-transparent overlay with backdrop blur. `"none"` renders the pager without a background. |
| `pagerRounded` | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `"medium"` | Border-radius preset applied to each pager dot. |
| `rounded` | `'none' \| 'small' \| 'medium' \| 'large'` | `"medium"` | Border-radius preset applied to the scroll view container. |
| `width` | `string \| number` | — | **Required.** Width of the scroll view. Accepts a CSS string (e.g., `"640px"`) or a unitless number. |

`ScrollViewComponent` has no outputs.

---

### Content projection

Project a single `ng-template` inside `<mona-scroll-view>` to control how each slide is rendered.

| Template variable | Type | Description |
|-------------------|------|-------------|
| `$implicit` | `unknown` | The current data item. |
| `width` | `number` | Content area width in pixels. |
| `height` | `number` | Content area height in pixels. |

---

### Exported types

| Type | Description |
|------|-------------|
| `PagerOverlay` | `'dark' \| 'light' \| 'none'` — valid values for the `pagerOverlay` input. |

```typescript
import type { PagerOverlay } from "@mirei/mona-ui";
```

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and generated metadata
- [x] index model documented as two-way bindable
- [x] class input (userClass alias) documented
- [x] height and width marked as required
- [x] No outputs table (component has no outputs)
- [x] Template context ($implicit, width, height) verified from component template
- [x] Form integration omitted (not a form control)
- [x] Keyboard handling (ArrowLeft/ArrowRight) verified from setSubscriptions() in source
- [x] ARIA attributes verified from host bindings, component template, and updated source
- [x] prefers-reduced-motion CSS support verified in component styles
- [x] PagerOverlay exported type documented
- [x] ScrollViewActivePageDirective omitted (internal directive, not for direct consumer use)
- [x] No internal computed signals, private methods, or CSS class names in docs
- [x] No Tailwind class names in docs
- [x] Inputs table sorted A→Z
-->
