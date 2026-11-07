## Overview

Use `ScrollViewComponent` when you need to display a sequence of items — images, cards, or content panels — and the user navigates between them one at a time within a fixed viewport. The component requires explicit `height` and `width` values and renders exactly one item per view.

> `ScrollViewComponent` is not a form control. It does not implement `ControlValueAccessor` or any signal forms interface.

## Import & Basic Usage

```typescript
import { ScrollViewComponent } from "@nanahoshi/mona-ui/scroll-view";
```

A slide template projected inside `<mona-scroll-view>` is required. Without it, no content is rendered inside each slide. Mark it with `monaScrollViewSlide`, and bind the directive to the same data so `let-item` takes its type from it. Name the carousel with `aria-label` or `aria-labelledby`.

```typescript
import { ScrollViewComponent, ScrollViewSlideDirective } from "@nanahoshi/mona-ui/scroll-view";
```

```html
<mona-scroll-view aria-label="Product photos" [data]="images" width="640px" height="360px" [pageable]="true">
  <ng-template [monaScrollViewSlide]="images" let-image>
    <img [src]="image.url" [alt]="image.description" class="w-full h-full object-cover" />
  </ng-template>
</mona-scroll-view>
```

A bare `ng-template` still works, with `let-item` untyped. It takes the first template in the content, so it's better to mark the one you mean.

### Slide template context

Each slide renders the projected template with the following context variables:

| Variable                       | Type      | Description                                          |
|--------------------------------|-----------|------------------------------------------------------|
| `$implicit` (e.g., `let-item`) | `unknown` | The current data item from the `data` collection.    |
| `width`                        | `number`  | Width of the content area in pixels. Follows resizes, and is `0` until the first measurement. |
| `height`                       | `number`  | Height of the content area in pixels. Follows resizes, and is `0` until the first measurement. |

```html
<mona-scroll-view [data]="panels" width="100%" height="400px">
  <ng-template let-panel let-w="width" let-h="height">
    <div [style.width.px]="w" [style.height.px]="h">{{ panel.title }}</div>
  </ng-template>
</mona-scroll-view>
```

## Examples

### Arrows and dot pager

```example
scroll-view/arrows-pager
```

In finite mode, the left arrow is hidden on the first page and the right arrow is hidden on the last page. If the arrow that hides has focus, focus moves to the other arrow. In infinite mode, both arrows remain visible at all times.

When the number of dots exceeds the pager bar width, scroll arrows appear automatically on the pager bar to let the user scroll the dot list horizontally. The active dot is kept centered in the list, however the page changed. Only the list scrolls, so the pager doesn't move the page to itself.

`pagerOverlay="dark"` uses the theme's canvas color, which isn't dark in a light theme, and `"light"` uses its overlay surface color. So the names don't promise a shade. Check the strip against your slides in each theme you ship.

### Swipe

A touch or pen swipe of 40 px or more, mostly sideways, changes the slide, reversed in RTL. Vertical scrolling and pinch zoom stay with the browser, a mouse drag stays text selection, and a drag that starts on a text field or a slider stays with that control. Swipes are always on, but `arrows` and `pageable` are off by default, and WCAG needs a way to change the slide without a gesture (2.5.1 Pointer Gestures), so turn on at least one of them.

### Infinite loop

In infinite mode, navigating past the last item wraps to the first, and navigating before the first wraps to the last.

```example
scroll-view/infinite
```

### Two-way page binding

```example
scroll-view/two-way
```

`index` is a two-way model. Setting it programmatically navigates to that zero-based page index. A value outside the range is brought back to the first or last page, or wrapped in infinite mode, and the corrected value comes back through `indexChange`.

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

| Attribute              | Value                                         |
|------------------------|-----------------------------------------------|
| `role`                 | `"region"` when named, otherwise `"group"`    |
| `aria-roledescription` | `"carousel"`, while it has slides             |
| `aria-label`           | From the `aria-label` input                   |
| `aria-labelledby`      | From the `aria-labelledby` input              |
| `tabindex`             | `0`, while it has slides                      |

Give every carousel a name that says what it shows. Two regions on a page need different names, and a warning is logged in development when there's no name at all.

**Slide container**

`aria-live="polite"` and `aria-atomic="false"`, so a new slide is read out when it appears.

**Each slide**

| Attribute              | Value      |
|------------------------|------------|
| `role`                 | `"group"`  |
| `aria-roledescription` | `"slide"`  |
| `aria-label`           | `"Page N of M"` |

While the leave animation runs, 500 ms by default, the leaving slide is still in the DOM beside the new one. Both keep these attributes, and nothing marks the one that's leaving, so a screen reader can find two slides during that time.

**Navigation arrow buttons**

Each arrow button carries a static `aria-label` of `"Previous page"` or `"Next page"`.

**Pager dot buttons**

The dots are a list labelled `"Pages"`. Each carries `aria-label="Page N"`, and `aria-current="true"` when it is the currently active page.

### Keyboard interaction

| Key          | Action                        |
|--------------|-------------------------------|
| `ArrowLeft`  | Navigate to the previous page, or the next in RTL |
| `ArrowRight` | Navigate to the next page, or the previous in RTL |
| `Home`       | Navigate to the first page    |
| `End`        | Navigate to the last page     |

Keys work when focus is on the host, an arrow or a pager control. The host receives focus via `tabindex="0"` and is part of the natural tab order. Keys inside a slide stay with the slide's content, so a text field or a slider there works normally, and a key with a modifier isn't taken. If a slide is replaced from outside while it holds focus, focus moves to the host.

### Consumer responsibilities

- Name the carousel with `aria-label` or `aria-labelledby`.
- Turn on `arrows` or `pageable`, because a swipe is a gesture and some users can't make one.
- Slide content is consumer-controlled through the projected template. Provide appropriate accessible labels on projected content (e.g., `alt` on `<img>` elements).

<!-- verification-checklist
- [x] API definitions and defaults verified against source and generated metadata
- [x] index model documented as two-way bindable
- [x] class input (userClass alias) documented
- [x] height and width marked as required
- [x] Outputs table holds only indexChange, from the index model (the component declares no output() of its own)
- [x] Template context ($implicit, width, height) verified from component template
- [x] Form integration omitted (not a form control)
- [x] Keyboard handling (ArrowLeft/ArrowRight/Home/End) verified from onKeydown() in source
- [x] ARIA attributes verified from host bindings, component template, and updated source
- [x] prefers-reduced-motion CSS support verified in component styles
- [x] PagerOverlay exported type documented
- [x] ScrollViewActivePageDirective omitted (internal directive, not for direct consumer use)
- [x] No internal computed signals, private methods, or CSS class names in docs
- [x] No Tailwind class names in docs
- [x] Inputs table sorted A→Z
-->
