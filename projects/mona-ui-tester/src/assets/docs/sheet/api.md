## Overview & Component Selection

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

## Feature Examples

### Side

```html
<mona-sheet side="bottom" title="Filters"> </mona-sheet>
```

`side` accepts `"top" | "right" | "bottom" | "left"` and defaults to `"right"`. Left and right sheets default to `min(100dvw, 24rem)` wide and `100dvh` high; top and bottom sheets default to `100dvw` wide with automatic height capped at `90dvh`.

### Mobile bottom sheet

```html
@if (filtersOpen()) {
    <mona-sheet
        side="bottom"
        title="Filters"
        description="Narrow the displayed results."
        height="min(90dvh, 36rem)"
        (closed)="filtersOpen.set(false)">
        <app-product-filters />
    </mona-sheet>
}
```

Large projected content scrolls inside the Sheet while its header and close button remain in place. The page behind it cannot scroll while the sheet is open. Width and height values based on `dvw`/`dvh` adapt when mobile browser chrome or device orientation changes.

### Custom projected content

```html
@if (navigationOpen()) {
    <mona-sheet side="left" ariaLabel="Main navigation" [closable]="false" (closed)="navigationOpen.set(false)">
        <app-mobile-navigation />
    </mona-sheet>
}
```

Any Angular content can be projected. If a visible title is not appropriate, provide `ariaLabel` so the sheet still has an accessible name — Sheet content must have either a `title` or an `ariaLabel`.

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

## Technical & Behavior Notes

### All inputs are one-shot

Every input is read once when the sheet opens, on the first render. Changing an input afterward has no effect on the already-open sheet — there is no equivalent of Window's or Dialog's live-input set.

### `close` fires for every close path

`close` emits for the close (X) button, the Escape key, and a backdrop click. Call `event.preventDefault()` synchronously inside a `close` handler to cancel any of these, the same way `PopupRef.beforeClose` works (see the Popup documentation's [Preventing a close](/components/popup#preventing-a-close) section, since Sheet is built on the same mechanism).

### Scroll blocking

Sheet blocks scrolling of the page behind it for as long as it is open, regardless of `side`.

## Accessibility & Forms Integration

### Keyboard

The Escape key requests a close when `closeOnEscape` is `true` (the default).

### Focus

Sheet traps focus inside itself for as long as it is open — Tab and Shift+Tab cannot move focus to the rest of the page. Focus is restored to the previously focused element when the sheet closes.

### ARIA

| Attribute          | When present               | Value                                                       |
| ------------------ | --------------------------- | ------------------------------------------------------------ |
| `role`             | Always                      | `"dialog"`                                                   |
| `aria-modal`       | Always                      | `"true"`                                                     |
| `aria-labelledby`  | Only when `title` is set    | ID of the title element                                      |
| `aria-describedby` | Only when `description` is set | ID of the description element                              |
| `aria-label`       | Only when `title` is absent | The `ariaLabel` input                                        |

Sheet content must have either a `title` or an `ariaLabel` so that the modal has an accessible name.

Form integration is not applicable — Sheet is a container, not a form control.

## API

### `SheetComponent`

**Selector:** `mona-sheet`

#### Inputs

| Name                   | Type                                     | Default        | Description                                                               |
| ---------------------- | ----------------------------------------- | -------------- | -------------------------------------------------------------------------- |
| `ariaLabel`            | `string`                                  | —              | Accessible name used when `title` is absent.                              |
| `closable`             | `boolean`                                 | `true`         | Sets the visibility of the close button.                                  |
| `closeOnBackdropClick` | `boolean`                                 | `true`         | Sets whether a backdrop click requests that the sheet close.              |
| `closeOnEscape`        | `boolean`                                 | `true`         | Sets whether the sheet should close when the escape key is pressed.       |
| `description`          | `string`                                  | —              | Supporting text displayed below the title and referenced by `aria-describedby`. |
| `height`               | `number \| string`                        | side-dependent | Explicit height. Numbers are interpreted as pixels.                       |
| `side`                 | `"top" \| "right" \| "bottom" \| "left"`  | `"right"`      | Viewport edge to which the sheet is attached.                             |
| `title`                | `string`                                  | —              | Visible title and accessible name.                                        |
| `width`                | `number \| string`                        | side-dependent | Explicit width. Numbers are interpreted as pixels.                        |

#### Outputs

| Name     | Type              | Description                                                             |
| -------- | ----------------- | ------------------------------------------------------------------------ |
| `close`  | `PopupCloseEvent` | Emitted before closing. Preventable — see [`close` fires for every close path](#close-fires-for-every-close-path). |
| `closed` | `void`            | Emitted after the leave animation completes and the popup is disposed.  |

---

<!-- verification-checklist
- [x] SheetComponent inputs and defaults verified against sheet.component.ts source, including the horizontal-vs-vertical width/height defaults resolved in #open()
- [x] SheetComponent outputs verified (close: PopupCloseEvent, closed: void) against sheet.component.ts source
- [x] All-inputs-one-shot behavior verified: every input is read only inside #open(), which runs once via afterNextRender
- [x] close firing for close button, Escape, and backdrop click verified against sheet.component.ts's #popupRef.beforeClose subscription and the closeOnEscape/closeOnBackdropClick settings passed to PopupService.create
- [x] blockScroll: true verified against the PopupSettings passed in #open()
- [x] role="dialog"/aria-modal/aria-labelledby/aria-describedby/aria-label verified against sheet.component.html template bindings
- [x] Focus trap (cdkTrapFocus, cdkTrapFocusAutoCapture) and restoreFocus: true verified against sheet.component.html and the PopupSettings passed in #open()
- [x] No SheetService or SheetRef exists — SheetComponent is the sole export alongside the SheetSide type, verified against public-api.ts
-->
