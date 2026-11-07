## Overview

Sheet displays a modal panel attached to an edge of the viewport, with an optional title, description, and close button, plus projected content. It is built on `PopupService` internally, like every other Mona UI overlay.

`SheetComponent` (`<mona-sheet>`) is declarative only — there is no `SheetService`. Place it behind an `@if` in your template; the sheet opens after the first render and closes when the host element is destroyed or when the consumer closes it.

**Use `Sheet` when:**

- The overlay should slide in from a viewport edge (`top`, `right`, `bottom`, or `left`) instead of appearing centered
- The content is mobile navigation, filters, a form, or a configuration panel

**Use `Dialog` instead when:**

- You need a modal confirmation, message, or short form centered in the viewport, with a title/description/actions layout and built-in action-button wiring

**Use `Window` instead when:**

- The user needs to drag, resize, minimize, or maximize the overlay

**Use `Popup` directly when:**

- You need a custom anchored overlay with no title/header structure at all

## Import & Quick Start

```typescript
import { SheetComponent } from "@nanahoshi/mona-ui/sheet";
```

```html
<button monaButton (click)="sheetOpen.set(true)">Edit profile</button>

@if (sheetOpen()) {
    <mona-sheet title="Edit profile" description="Make changes to your profile." (closed)="sheetOpen.set(false)">
        <form>…</form>
    </mona-sheet>
}
```

`SheetComponent` opens automatically once its host renders; there is no explicit `open()` call.

## Examples

### Editing in a sheet

The field is copied when the sheet opens, and only saved back when the user saves.

```example
sheet/form
```

### Side

`side` accepts `"top" | "right" | "bottom" | "left" | "start" | "end"` and defaults to `"right"`. `left` and `right` are physical edges in every direction; `start` and `end` follow the text direction, so `start` opens from the left in left-to-right pages and from the right in right-to-left ones. The border always faces the page. Left and right sheets default to `min(100dvw, 24rem)` wide and `100dvh` high; top and bottom sheets default to `100dvw` wide with automatic height capped at `90dvh`.

### Mobile bottom sheet

```example
sheet/bottom
```

Large projected content scrolls inside the Sheet while its header and close button remain in place. The page behind it cannot scroll while the sheet is open. Width and height values based on `dvw`/`dvh` adapt when mobile browser chrome or device orientation changes.

### Custom projected content

Any Angular content can be projected. If a visible title is not appropriate, provide `ariaLabel` so the sheet still has an accessible name — Sheet content must have either a `title` or an `ariaLabel`. This sheet has no close button, so it closes on Escape, a backdrop click, or choosing a page.

```example
sheet/navigation
```

### Preventing a close

```typescript
protected onSheetClose(event: PopupCloseEvent): void {
    if (this.hasUnsavedChanges()) {
        event.preventDefault();
    }
}
```

```html
<mona-sheet (close)="onSheetClose($event)"> </mona-sheet>
```

## Behavior

### `side` is fixed once the sheet opens

`side` is read once, on the first render, and fixes the viewport edge the sheet is attached to, the direction it slides in and out, and the edge its border is on. `start` and `end` are resolved against the direction at that moment. Changing `side` or the direction on an open sheet has no effect — close the sheet and reopen it.

Every other input is live: `title`, `description`, `ariaLabel`, and `closable` re-render as usual, `width` and `height` resize the open sheet, and `closeOnEscape` and `closeOnBackdropClick` apply from the moment they change.

### `close` fires for every close path

`close` emits for the close (X) button, the Escape key, and a backdrop click. Call `event.preventDefault()` synchronously inside a `close` handler to cancel any of these, the same way `PopupRef.beforeClose` works (see the Popup documentation's [Preventing a close](/components/popup#preventing-a-close) section, since Sheet is built on the same mechanism).

### Scroll blocking

Sheet blocks scrolling of the page behind it for as long as it is open, regardless of `side`. The rest of the page is also `inert` until the sheet starts closing, so a pointer, Tab, or a screen reader can't reach it; popups opened from inside the sheet stay usable.

## Forms Integration

Sheet is a container, not a form control, so it has no form integration.

## Accessibility

### Keyboard

The Escape key requests a close when `closeOnEscape` is `true` (the default).

### Focus

Sheet traps focus inside itself for as long as it is open — Tab and Shift+Tab cannot move focus to the rest of the page. Focus is restored to the previously focused element when the sheet closes.

### ARIA

| Attribute          | When present                   | Value                         |
|--------------------|--------------------------------|-------------------------------|
| `role`             | Always                         | `"dialog"`                    |
| `aria-modal`       | Always                         | `"true"`                      |
| `aria-labelledby`  | Only when `title` is set       | ID of the title element       |
| `aria-describedby` | Only when `description` is set | ID of the description element |
| `aria-label`       | Only when `title` is absent    | The `ariaLabel` input         |

Sheet content must have either a `title` or an `ariaLabel` so that the modal has an accessible name. In development mode, a sheet without one logs a warning.

<!-- verification-checklist
- [x] SheetComponent inputs and defaults verified against sheet.component.ts source, including the horizontal-vs-vertical width/height defaults resolved in #open()
- [x] SheetComponent outputs verified (close: PopupCloseEvent, closed: void) against sheet.component.ts source
- [x] Batch 5 (module 11): start/end resolved against injectComponentDirection() at open time, physical left/right in RTL, inert page, and the dev-mode naming warning verified against sheet.component.ts and sheet.component.spec.ts
- [x] side-is-fixed behavior verified: side is read only inside #open(), which runs once via afterNextRender, and drives both #positionOverlay() and #resolveAnimation()
- [x] Live width/height verified against the #trackSize() effect calling overlayRef.updateSize()
- [x] Live closeOnEscape/closeOnBackdropClick verified against #isSuppressedCloseSource(), which vetoes those sources in the beforeClose subscription
- [x] close firing for close button, Escape, and backdrop click verified against sheet.component.ts's #popupRef.beforeClose subscription
- [x] blockScroll: true verified against the PopupSettings passed in #open()
- [x] role="dialog"/aria-modal/aria-labelledby/aria-describedby/aria-label verified against sheet.component.html template bindings
- [x] Focus trap (cdkTrapFocus, cdkTrapFocusAutoCapture) and restoreFocus: true verified against sheet.component.html and the PopupSettings passed in #open()
- [x] No SheetService or SheetRef exists — SheetComponent is the sole export alongside the SheetSide and SheetPhysicalSide types, verified against public-api.ts
-->
