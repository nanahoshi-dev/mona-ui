## Overview & Component Selection

Popup is the positioning and lifecycle primitive that other Mona UI overlay components are built on. `Tooltip`, `Popover`, the color picker, the drop-down tree, the grid filter menu, `Dialog`, and `Window` all create their overlays through `PopupService` internally. Reach for Popup directly when you need a custom anchored overlay that none of those higher-level components already cover.

There are two ways to use it:

- **`PopupComponent`** (`<mona-popup>`) is declarative. You place content inside the element, bind an `anchor`, and the component listens for a trigger event (a click, by default) on that anchor to open and close the popup for you.
- **`PopupService`** is imperative. Call `create()` with a `PopupSettings` object to open a popup from code — useful when content must be created on demand, when you do not have a fixed anchor in a template, or when one popup must be attached to many repeated elements at once (see [Multi-element popups](#multi-element-popups-via-css-selector)).

**Use `PopupComponent` when:**

- The anchor and trigger event are known up front in a template
- You want open/close wiring handled for you, including not opening a second popup while one is already open

**Use `PopupService` directly when:**

- You need to open a popup from a service, an event handler, or any place without direct template access to `<mona-popup>`
- The popup content is a dynamically created component instance rather than a fixed projected template
- One popup definition must be attached to many DOM elements matching a CSS selector

**Use a higher-level component instead when:**

- You need a hover hint — use `Tooltip`
- You need a labeled content panel anchored to a trigger — use `Popover`
- You need a modal dialog experience — use `Dialog` or `Window`

## Import & Quick Start

```typescript
import { PopupComponent } from "@nanahoshi/mona-ui";
```

```html
<button #anchor type="button">Open popup</button>
<mona-popup [anchor]="anchor">
    <div class="p-4">Popup content</div>
</mona-popup>
```

`anchor` accepts a raw `Element`, an `ElementRef`, or a `{ x, y }` point — `#anchor` above resolves to the native `<button>` element. The default `trigger` is `"click"` on that anchor.

## Anatomy & Public Structural Templates

Popup has a single content-projection slot. Everything placed inside `<mona-popup>...</mona-popup>` becomes the popup body, rendered the moment the popup opens. There is no structural template system or template context — for per-item template customization inside an overlay, use a higher-level component such as a drop-down list.

## Feature Examples

### Custom positioning

`anchorConnectionPoint` is the point on the anchor the popup attaches to; `popupConnectionPoint` is the point on the popup that touches the anchor. Both accept the same nine-position keyword set (see the [API](#api) table below).

```html
<mona-popup [anchor]="anchor" anchorConnectionPoint="topright" popupConnectionPoint="bottomleft">
    <div class="p-4">Popup content</div>
</mona-popup>
```

If the resulting position would overflow the viewport, the popup automatically tries alternate positions, then pushes itself back into view (see `withPush`). To take full control, supply an explicit CDK `positions` array — when provided and non-empty, it replaces the connection-point-based positions entirely.

```typescript
import type { ConnectedPosition } from "@angular/cdk/overlay";

protected readonly positions: ConnectedPosition[] = [
    { originX: "end", originY: "top", overlayX: "start", overlayY: "top" }
];
```

```html
<mona-popup [anchor]="anchor" [positions]="positions">
    <div class="p-4">Popup content</div>
</mona-popup>
```

### Backdrop and dismissal

`closeOnOutsideClick` (default `true`) and `closeOnEscape` (default `true`) close the popup without a backdrop. Add a backdrop when you want to dim or block the rest of the page; `closeOnBackdropClick` only has an effect once `hasBackdrop` is `true`.

```html
<mona-popup [anchor]="anchor" [hasBackdrop]="true" [closeOnBackdropClick]="true">
    <div class="p-4">Popup content</div>
</mona-popup>
```

### Hover-triggered popup

`trigger` accepts any DOM event name dispatched on the anchor, not a fixed set — `"contextmenu"` and `"pointerover"` work the same way as the default `"click"`.

```html
<mona-popup [anchor]="anchor" trigger="pointerover" [closeOnMouseLeave]="true">
    <div class="p-4">Popup content</div>
</mona-popup>
```

### Animation presets

`animation` accepts `true` (default preset), `false` (no animation), or a `PopupAnimationSettings` object with your own CSS class names. Three presets are exported:

| Export                   | Effect                                                                                 |
|--------------------------|----------------------------------------------------------------------------------------|
| `defaultPopupAnimation`  | Scale and fade — used when `animation` is `true` or omitted                            |
| `dropdownPopupAnimation` | Scale and fade anchored to the top edge, suited to popups that open below their anchor |
| `fadePopupAnimation`     | Fade only, no scaling                                                                  |

```typescript
import { dropdownPopupAnimation } from "@nanahoshi/mona-ui";
```

```html
<mona-popup [anchor]="anchor" [animation]="dropdownPopupAnimation">
    <div class="p-4">Popup content</div>
</mona-popup>
```

To use your own classes:

```typescript
protected readonly animation = { enter: "my-enter-class", leave: "my-leave-class" };
```

### Imperative usage with `PopupService`

```typescript
import { inject, TemplateRef } from "@angular/core";
import { PopupService } from "@nanahoshi/mona-ui";

protected readonly popupService = inject(PopupService);

open(anchor: HTMLElement, content: TemplateRef<unknown>): void {
    const popupRef = this.popupService.create({ anchor, content });
    popupRef.closed.subscribe(event => {
        console.log(event.result, event.via);
    });
}
```

`create()` returns a `PopupRef` synchronously; the popup is already opening by the time it returns.

### Closing programmatically and passing a result

```typescript
confirm(popupRef: PopupRef): void {
    popupRef.close({ confirmed: true });
}
```

`close()` accepts an optional result value and an optional delay in milliseconds. Without animation, or when you pass `0` explicitly, the popup is removed from the DOM and `closed` emits immediately. With animation, the popup waits for the leave animation to finish first — see [Close timing](#close-timing).

### Preventing a close

```typescript
this.popupService.create({
    anchor,
    content,
    preventClose: event => !this.canClose()
});
```

Return `true` from `preventClose`, or call `event.preventDefault()` on the received `PopupCloseEvent`, to cancel the close. This setting only governs the built-in close triggers — see [Preventing a close](#preventing-a-close-2) under Technical & Behavior Notes for which paths it covers.

### Multi-element popups via CSS selector

`PopupService.create()` accepts a CSS selector string as `anchor` (this is not available on `PopupComponent`, whose `anchor` input only accepts an `Element`, `ElementRef`, or point).

```typescript
this.popupService.create({
    anchor: ".help-icon",
    content: helpTemplate
});
```

Every element matching the selector at the time `create()` runs gets its own popup, opened on `pointerenter` and closed on `pointerleave`. See [Multi-element popups](#multi-element-popups) under Technical & Behavior Notes for important caveats.

### Scroll behavior

`withScrollTracking` (default `true`) and `closeOnScroll` (default `false`) are independent settings:

```html
<mona-popup [anchor]="anchor" [withScrollTracking]="true" [closeOnScroll]="false">
    <div class="p-4">Popup content</div>
</mona-popup>
```

- `withScrollTracking` repositions the popup when an ancestor scrolls or the window resizes. It has no effect when `positionStrategy` is `"global"`.
- `closeOnScroll` closes the popup immediately on the next scroll or resize event instead of repositioning it.

### Focus restoration

| `restoreFocus`     | Behavior                                                                                              |
|--------------------|-------------------------------------------------------------------------------------------------------|
| `"auto"` (default) | Restores focus to the anchor only if the anchor itself held focus immediately before the popup opened |
| `true`             | Always restores focus to the anchor when the popup closes                                             |
| `false`            | Never restores focus — recommended for hover-triggered popups                                         |

Focus capture and restoration only apply to element or point anchors, not to CSS-selector multi-element popups.

## Technical & Behavior Notes

### Toggle behavior

`PopupComponent` toggles: firing the trigger event again while its popup is open closes that popup instead of opening a second one.

### Close timing

Calling `close()` without a delay argument waits for the popup's leave animation to finish (or completes immediately if `animation` is `false`) before the popup is removed from the DOM and `closed` emits. Pass `0` as the delay to force immediate removal regardless of animation.

### Preventing a close

`preventClose` and a `beforeClose` subscriber that calls `event.preventDefault()` are not equivalent:

- `preventClose` (and `event.preventDefault()` from inside it) is only consulted by the built-in close triggers: backdrop click, outside click, the Escape key, mouse-leave, and scroll-close.
- Calling `event.preventDefault()` from a `beforeClose` subscription cancels **any** close, including a direct `popupRef.close()` call, as long as it runs synchronously when `beforeClose` emits.

### Multi-element popups

Popups created with a CSS-selector `anchor` always open on `pointerenter` and close on `pointerleave` — the per-trigger configuration available on `PopupComponent` does not apply to them. Only elements present in the DOM when `create()` is called are included; elements added afterward require calling `create()` again.

### Anchor positioning defaults differ between the component and the service

`PopupComponent` defaults `anchorConnectionPoint` to `"bottomcenter"` and `popupConnectionPoint` to `"topcenter"`. Calling `PopupService.create()` directly without these settings falls back to `"bottomleft"` and `"topleft"` respectively.

## Accessibility Notes

### Keyboard

The Escape key closes the popup when `closeOnEscape` is `true` (the default), as long as the popup is currently attached.

### Focus

Popup does not implement a focus trap. Focus restoration to the anchor on close is controlled by `restoreFocus` (see [Focus restoration](#focus-restoration) above). If your use case requires trapping focus inside the overlay, consider `Dialog` or `Window` instead.

### ARIA

Popup renders no ARIA roles or attributes on the anchor or the popup content itself — it is a generic positioning primitive. Provide the appropriate role (for example `role="dialog"`, `role="menu"`, or `role="tooltip"`) and labeling on your projected content, and any `aria-expanded` / `aria-haspopup` state on the anchor, yourself.

### Motion

The built-in animation presets respect `prefers-reduced-motion`.

## API

### `PopupComponent`

**Selector:** `mona-popup`

#### Inputs

| Name                    | Type                                                 | Default          | Description                                                                                                                           |
|-------------------------|------------------------------------------------------|------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `anchor`                | `Element \| ElementRef<Element> \| Point`            | —                | Required. The anchor element or point the popup is positioned relative to.                                                            |
| `anchorConnectionPoint` | `ConnectionPoint`¹                                   | `"bottomcenter"` | The point on the anchor the popup attaches to.                                                                                        |
| `animation`             | `boolean \| PopupAnimationSettings`                  | `true`           | Animation behavior on open/close. See [Animation presets](#animation-presets).                                                        |
| `backdropClass`         | `string \| string[]`                                 | `[]`             | Classes applied to the backdrop. Only rendered when `hasBackdrop` is `true`.                                                          |
| `closeOnBackdropClick`  | `boolean`                                            | `true`           | Closes the popup on backdrop click. Only applies when `hasBackdrop` is `true`.                                                        |
| `closeOnEscape`         | `boolean`                                            | `true`           | Closes the popup when Escape is pressed.                                                                                              |
| `closeOnMouseLeave`     | `boolean`                                            | `false`          | Closes the popup when the pointer leaves the anchor.                                                                                  |
| `closeOnOutsideClick`   | `boolean`                                            | `true`           | Closes the popup on a click outside both the anchor and the popup.                                                                    |
| `closeOnScroll`         | `boolean`                                            | `false`          | Closes the popup on the next scroll or resize event instead of repositioning it.                                                      |
| `data`                  | `T`                                                  | —                | Arbitrary data made available to the popup content.                                                                                   |
| `hasBackdrop`           | `boolean`                                            | `false`          | Renders a backdrop behind the popup.                                                                                                  |
| `height`                | `number \| string`                                   | —                | Fixed height of the popup.                                                                                                            |
| `maxHeight`             | `number \| string`                                   | —                | Maximum height of the popup.                                                                                                          |
| `maxWidth`              | `number \| string`                                   | —                | Maximum width of the popup.                                                                                                           |
| `minHeight`             | `number \| string`                                   | —                | Minimum height of the popup.                                                                                                          |
| `minWidth`              | `number \| string`                                   | —                | Minimum width of the popup.                                                                                                           |
| `offset`                | `PopupOffset`²                                       | —                | Additional `{ horizontal, vertical }` pixel offset applied to the resolved position.                                                  |
| `popupClass`            | `string \| string[]`                                 | `[]`             | Classes applied to the popup's CDK overlay panel.                                                                                     |
| `popupConnectionPoint`  | `ConnectionPoint`¹                                   | `"topcenter"`    | The point on the popup that attaches to the anchor.                                                                                   |
| `popupWrapperClass`     | `string \| string[]`                                 | `[]`             | Classes applied to the popup's inner content wrapper.                                                                                 |
| `positionStrategy`      | `"global" \| "connected"`                            | `"connected"`    | `"connected"` positions relative to the anchor; `"global"` positions relative to the viewport.                                        |
| `positions`             | `Array<ConnectedPosition \| ConnectionPositionPair>` | —                | Explicit CDK position list, tried in order. Overrides `anchorConnectionPoint` / `popupConnectionPoint` when provided and non-empty.   |
| `preventClose`          | `(event: PopupCloseEvent) => boolean`                | —                | Return `true` to cancel a close from a built-in trigger. See [Preventing a close](#preventing-a-close-1).                             |
| `providers`             | `StaticProvider[]`                                   | `[]`             | Additional providers available to the popup content's injector.                                                                       |
| `restoreFocus`          | `boolean \| "auto"`                                  | `"auto"`         | Controls focus restoration to the anchor on close. See [Focus restoration](#focus-restoration).                                       |
| `trigger`               | `string`                                             | `"click"`        | DOM event name dispatched on the anchor that opens (and toggles) the popup.                                                           |
| `width`                 | `number \| string`                                   | —                | Fixed width of the popup. When omitted and the anchor is an `Element` or `ElementRef`, the popup matches the anchor's rendered width. |
| `withPush`              | `boolean`                                            | `true`           | Pushes the popup back into the viewport when it would otherwise overflow.                                                             |
| `withScrollTracking`    | `boolean`                                            | `true`           | Repositions the popup on ancestor or window scroll/resize. No effect when `positionStrategy` is `"global"`.                           |

¹ `ConnectionPoint` is `"topleft" | "topcenter" | "topright" | "centerleft" | "center" | "centerright" | "bottomleft" | "bottomcenter" | "bottomright"`. <!-- TODO(owner-review): this type is referenced by the public API but is not exported under its own name from the package — confirm whether it should be exported. -->

² `PopupOffset` is `{ horizontal?: number; vertical?: number }`. <!-- TODO(owner-review): not exported under its own name — confirm whether it should be exported. -->

#### Outputs

| Name    | Type       | Description                                            |
|---------|------------|--------------------------------------------------------|
| `close` | `void`     | Emitted after the popup has fully closed.              |
| `open`  | `PopupRef` | Emitted when the popup opens, carrying its `PopupRef`. |

#### Public methods

| Name                 | Description                                |
|----------------------|--------------------------------------------|
| `closePopup(): void` | Closes the popup if one is currently open. |

---

### `PopupService`

Injectable service, `providedIn: "root"`.

#### Public methods

| Name                                        | Description                                                                                                                                                                                                                                                                                      |
|---------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `create(settings: PopupSettings): PopupRef` | Opens a popup and returns its `PopupRef`. If `settings.anchor` is a CSS selector string, creates a hover-triggered popup for every matching element (see [Multi-element popups](#multi-element-popups)); otherwise creates a single popup attached to the given element, `ElementRef`, or point. |

---

### `PopupRef`

Returned by `PopupService.create()` and emitted via `PopupComponent`'s `open` output.

#### Public methods

| Name                                                  | Description                                                                                                               |
|-------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| `close<R>(result?: R, delay?: number): void`          | Requests the popup to close, optionally carrying a result and a delay in milliseconds. See [Close timing](#close-timing). |
| `closeWithDelay<R>(delay?: number, result?: R): void` | Convenience wrapper around `close()` that defaults `delay` to `100`.                                                      |

#### Properties

| Name              | Type                                 | Description                                                                                                                         |
|-------------------|--------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| `beforeClose`     | `Observable<PopupCloseEvent>`        | Emits before any close proceeds. Call `event.preventDefault()` synchronously to cancel any close, including direct `close()` calls. |
| `closeStart`      | `Observable<PopupCloseEvent>`        | Emits once a close has begun and can no longer be canceled, before the leave animation completes.                                   |
| `closed`          | `Observable<PopupCloseEvent>`        | Emits once the popup has fully closed, after any leave animation finishes.                                                          |
| `component`       | `ComponentRef<any> \| null`          | The hosted component instance, or `null` when the popup content is a `TemplateRef`.                                                 |
| `opened`          | `Observable<void>`                   | Emits once when the popup opens.                                                                                                    |
| `overlayRef`      | `OverlayRef`                         | The underlying CDK overlay reference, for advanced resizing or repositioning.                                                       |
| `positionChanges` | `Observable<ConnectionPositionPair>` | Emits the new connection pair whenever the resolved position changes. Only meaningful with `positionStrategy: "connected"`.         |

---

### `PopupCloseEvent<R = unknown>`

Extends `PreventableEvent`.

#### Properties

| Name            | Type                                                                                                                         | Description                                                                                        |
|-----------------|------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| `result`        | `R \| undefined`                                                                                                             | The result value passed to `close()`, if any.                                                      |
| `via`           | `"backdropClick" \| "closeButton" \| "escape" \| "mouseLeave" \| "outsideClick" \| "programmatic" \| "scroll" \| undefined`³ | The source of the close.                                                                           |
| `originalEvent` | `Event \| undefined`                                                                                                         | Inherited from `PreventableEvent`. The native DOM event that triggered the close, when applicable. |
| `type`          | `string \| undefined`                                                                                                        | Inherited from `PreventableEvent`.                                                                 |

#### Inherited methods

| Name                            | Description                            |
|---------------------------------|----------------------------------------|
| `preventDefault(): void`        | Marks the event as prevented.          |
| `isDefaultPrevented(): boolean` | Whether `preventDefault()` was called. |

³ `"closeButton"` is part of the underlying `PopupCloseSource` type but is not currently emitted by Popup itself. <!-- TODO(owner-review): PopupCloseSource enum is not exported from the package; via's literal values are documented here from source instead. -->

---

### Exported Types

#### `PopupSettings<T = unknown, C = void>`

The settings object accepted by `PopupService.create()`. Most fields mirror the `PopupComponent` inputs above; differences and service-only fields are listed here.

| Field                   | Type                                 | Default        | Description                                                                                                                                                                           |
|-------------------------|--------------------------------------|----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `anchor`                | `PopupAnchor`                        | —              | Required. An `Element`, `ElementRef`, point, or CSS selector string. Only the service accepts a selector string — see [Multi-element popups](#multi-element-popups-via-css-selector). |
| `anchorConnectionPoint` | `ConnectionPoint \| null`            | `"bottomleft"` | See note on differing defaults in [Technical & Behavior Notes](#anchor-positioning-defaults-differ-between-the-component-and-the-service).                                            |
| `content`               | `TemplateRef<C> \| ComponentType<C>` | —              | Required. The popup's content — a template reference or a component class.                                                                                                            |
| `popupConnectionPoint`  | `ConnectionPoint \| null`            | `"topleft"`    | See note on differing defaults above.                                                                                                                                                 |

All other fields (`animation`, `backdropClass`, `closeOnBackdropClick`, `closeOnEscape`, `closeOnMouseLeave`, `closeOnOutsideClick`, `closeOnScroll`, `data`, `hasBackdrop`, `height`, `maxHeight`, `maxWidth`, `minHeight`, `minWidth`, `offset`, `popupClass`, `popupWrapperClass`, `positionStrategy`, `positions`, `preventClose`, `providers`, `restoreFocus`, `width`, `withPush`, `withScrollTracking`) match the `PopupComponent` inputs of the same name, including defaults, with one exception: `PopupSettings` has no `trigger` field — see [Multi-element popups](#multi-element-popups) for how open/close is triggered when using the service directly.

#### `PopupAnimationSettings`

| Field   | Type                 | Description                                   |
|---------|----------------------|-----------------------------------------------|
| `enter` | `string \| string[]` | CSS class(es) applied while the popup opens.  |
| `leave` | `string \| string[]` | CSS class(es) applied while the popup closes. |

#### `PopupAnchor`

`Element | ElementRef<Element> | Point | string`. A CSS selector string is only meaningful when passed to `PopupService.create()`.

#### Animation preset constants

| Export                   | Type                               |
|--------------------------|------------------------------------|
| `defaultPopupAnimation`  | `Required<PopupAnimationSettings>` |
| `dropdownPopupAnimation` | `Required<PopupAnimationSettings>` |
| `fadePopupAnimation`     | `Required<PopupAnimationSettings>` |

See [Animation presets](#animation-presets) above for their visual effect.

---

<!-- verification-checklist
- [x] All PopupComponent inputs and defaults verified against popup.component.ts source (current state, including closeOnScroll/restoreFocus added during this session and the rxTimeout-based ngAfterViewInit)
- [x] PopupComponent outputs verified (close: void, open: PopupRef)
- [x] closePopup() public method verified
- [x] PopupService.create() verified as the only public method; single-element vs CSS-selector branching verified in source
- [x] PopupRef public methods/properties verified against models/PopupRef.ts
- [x] PopupCloseEvent properties verified against models/PopupCloseEvent.ts; PreventableEvent base verified exported via index.ts
- [x] PopupCloseSource enum confirmed NOT exported from index.ts (only PopupCloseEvent is) — documented via's values as literals instead, flagged TODO(owner-review)
- [x] ConnectionPoint and PopupOffset confirmed referenced in public API surface but not separately exported — flagged TODO(owner-review)
- [x] preventClose vs beforeClose.preventDefault() distinction verified against PopupReference.close() and PopupService's shouldPreventClose() call sites
- [x] Close timing (animation-aware vs delay=0) verified against PopupReference.close() and the wrapper's animation-complete signal
- [x] Multi-element CSS-selector behavior verified against PopupService.setupInternalEventDelegation() — pointerenter/pointerleave only, one-time querySelectorAll, no MutationObserver
- [x] Differing anchorConnectionPoint/popupConnectionPoint defaults between PopupComponent ("bottomcenter"/"topcenter") and PopupService.getPosition() ("bottomleft"/"topleft") verified
- [x] No ARIA roles/attributes rendered by Popup confirmed by absence of role/aria-* bindings in popup.component.html, popup-wrapper.component.html, and both component .ts files
- [x] No focus trap implementation found in popup.service.ts or popup-wrapper.component.ts
- [x] Escape-key close behavior verified against setupEscapeKeyListener()
- [x] prefers-reduced-motion support verified in popup-wrapper.component.ts inline styles
- [x] Components consuming PopupService internally (Tooltip, Popover, color picker, drop-down tree, grid filter menu, Dialog, Window, popup-menu) verified via repository-wide grep
- [x] Animation preset exports (defaultPopupAnimation, dropdownPopupAnimation, fadePopupAnimation) verified exported via index.ts
- [x] No internal-only symbols (PopupWrapperComponent, PopupReference, PopupRefParams, PopupInjectionTokens) documented as public API
- [x] component-metadata.json regenerated via `npm run build:metadata` and cross-checked for closeOnScroll/restoreFocus
- [x] Internal markdown anchor cross-links verified against MarkdownDocComponent's heading-slug logic, including the duplicate "Preventing a close" heading resolving to `#preventing-a-close-2`
-->
