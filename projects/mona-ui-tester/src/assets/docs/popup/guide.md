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
import { PopupComponent } from "@nanahoshi/mona-ui/popup";
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

## Examples

### Custom positioning

`anchorConnectionPoint` is the point on the anchor the popup attaches to; `popupConnectionPoint` is the point on the popup that touches the anchor. Both accept the same nine-position keyword set (see the [API](#api) table below). Popup adds no ARIA, so the example sets the role, the name and `aria-expanded` itself.

```example
popup/positioning
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

```example
popup/backdrop
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
import { dropdownPopupAnimation } from "@nanahoshi/mona-ui/popup";
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

`create()` returns a `PopupRef` synchronously; the popup is already opening by the time it returns. A template gets no context, so the example keeps the `PopupRef` to close it with the answer, and moves focus into the popup once it has opened, since the overlay sits at the end of the page, far from the anchor in Tab order.

```example
popup/service
```

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

- `Element | ElementRef<Element> | Point | string`. A CSS selector string is only meaningful when passed to `PopupService.create()`.

## Accessibility Notes

### Keyboard

The Escape key closes the popup when `closeOnEscape` is `true` (the default), as long as the popup is currently attached.

### Focus

Popup does not implement a focus trap. Focus restoration to the anchor on close is controlled by `restoreFocus` (see [Focus restoration](#focus-restoration) above). If your use case requires trapping focus inside the overlay, consider `Dialog` or `Window` instead.

### ARIA

Popup renders no ARIA roles or attributes on the anchor or the popup content itself — it is a generic positioning primitive. Provide the appropriate role (for example `role="dialog"`, `role="menu"`, or `role="tooltip"`) and labeling on your projected content, and any `aria-expanded` / `aria-haspopup` state on the anchor, yourself.

### Motion

The built-in animation presets respect `prefers-reduced-motion`.

<!-- verification-checklist
- [x] All PopupComponent inputs and defaults verified against popup.component.ts source (current state, including closeOnScroll/restoreFocus added during this session and the rxTimeout-based ngAfterViewInit)
- [x] PopupComponent outputs verified (close: void, open: PopupRef)
- [x] closePopup() public method verified
- [x] PopupService.create() verified as the only public method; single-element vs CSS-selector branching verified in source
- [x] PopupRef public methods/properties verified against models/PopupRef.ts
- [x] PopupCloseEvent properties verified against models/PopupCloseEvent.ts; PreventableEvent exported from @nanahoshi/mona-ui/common
- [x] PopupCloseSource enum confirmed exported from popup/public-api.ts; via documented by that type
- [x] ConnectionPoint and PopupOffset confirmed exported from popup/public-api.ts; ConnectionPoint left/right map to CDK start/end (connectionPosition.ts)
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
