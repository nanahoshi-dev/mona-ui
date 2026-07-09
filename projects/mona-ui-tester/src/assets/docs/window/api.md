## Overview & Component Selection

Window displays a floating panel that the user can drag by its title bar, resize from its edges and corners, and minimize or maximize, with projected content and an optional footer/title/action bar. It is built on `PopupService` internally, like every other Mona UI overlay.

There are two ways to use it:

- **`WindowComponent`** (`<mona-window>`) is declarative. Place it behind an `@if` in your template; the window opens after the first render and closes when the host element is destroyed or when the consumer closes it.
- **`WindowService`** is imperative. Call `open()` with a `WindowSettings` object to open a window from code — useful from a service, an event handler, or anywhere without a fixed `@if` in a template.

**Use `Window` when:**

- The user needs to drag, resize, minimize, or maximize the overlay
- The content is closer to a floating panel or mini-application than a short message

**Use `Dialog` instead when:**

- You need a modal confirmation, message, or short form with built-in title/description/action-row structure, and dragging/resizing is not needed

**Use `Popup` directly when:**

- You need a custom anchored overlay with no title bar or window chrome at all

## Import & Quick Start

```typescript
import { WindowComponent } from "@nanahoshi/mona-ui";
```

```html
@if (windowVisible()) {
    <mona-window title="Details" [draggable]="true" [resizable]="true" (close)="windowVisible.set(false)">
        <p>Window content goes here.</p>
    </mona-window>
}
```

`WindowComponent` opens automatically once its host renders; there is no explicit `open()` call for declarative usage — see [`openWindow()` is not for reopening](#openwindow-is-not-for-reopening) if you are tempted to call the public `openWindow()` method.

Imperative usage returns a `WindowRef` synchronously:

```typescript
import { inject, TemplateRef, viewChild } from "@angular/core";
import { WindowService } from "@nanahoshi/mona-ui";

protected readonly content = viewChild<TemplateRef<unknown>>("content");
protected readonly windowService = inject(WindowService);

open(): void {
    const windowRef = this.windowService.open({
        title: "Details",
        content: this.content(),
        draggable: true,
        resizable: true
    });
}
```

## Anatomy & Public Structural Templates

Window has four structural template directives, each an `ng-template` placed as projected content inside `<mona-window>...</mona-window>`.

| Directive                        | Selector                                 | Template context                                           | Replaces                                                         |
|----------------------------------|------------------------------------------|------------------------------------------------------------|------------------------------------------------------------------|
| `WindowTitleTemplateDirective`   | `ng-template[monaWindowTitleTemplate]`   | None                                                       | The `title` input                                                |
| `WindowContentTemplateDirective` | `ng-template[monaWindowContentTemplate]` | None                                                       | Projected content passed directly to `<mona-window>`             |
| `WindowFooterTemplateDirective`  | `ng-template[monaWindowFooterTemplate]`  | None                                                       | No default — the footer area is empty unless provided            |
| `WindowActionTemplateDirective`  | `ng-template[monaWindowActionTemplate]`  | `WindowActionTemplateContext` (`{ $implicit: WindowRef }`) | No default — renders next to the minimize/maximize/close buttons |

```html
<mona-window [maximizable]="true">
    <ng-template monaWindowTitleTemplate>
        <span class="font-semibold">Details</span>
    </ng-template>
    <ng-template monaWindowActionTemplate let-windowRef>
        <button monaButton look="ghost" size="small" (click)="windowRef.center()">Center</button>
    </ng-template>
    <ng-template monaWindowFooterTemplate>
        <div class="flex justify-end gap-2 p-2 border-t border-border">
            <button monaButton (click)="windowVisible.set(false)">Close</button>
        </div>
    </ng-template>
</mona-window>
```

`WindowContentTemplateDirective` (`monaWindowContentTemplate`) is only meaningful with the declarative `<mona-window>` element — content is otherwise whatever is projected directly inside it. `WindowService.open()` instead takes `content` as a `TemplateRef` or a component type directly on `WindowSettings`.

## Feature Examples

### Draggable and resizable

```html
<mona-window title="Details" [draggable]="true" [resizable]="true"> </mona-window>
```

Both default to `false`. Dragging is grabbed from the title bar; resizing from eight generated edge/corner handles. Both the title bar and every resize handle are keyboard-focusable and respond to the arrow keys (Shift for a finer 1px step) when their respective input is enabled — see [Keyboard](#keyboard).

### Minimize and maximize

```html
<mona-window title="Details" [minimizable]="true" [maximizable]="true"> </mona-window>
```

Both default to `true` — set either to `false` to hide that button.

### Two-way position and size binding

```typescript
protected readonly top = model<number>();
protected readonly left = model<number>();
protected readonly width = model<number>(400);
protected readonly height = model<number>(300);
```

```html
<mona-window [(top)]="top" [(left)]="left" [(width)]="width" [(height)]="height" [draggable]="true" [resizable]="true">
</mona-window>
```

`top`, `left`, `width`, and `height` are two-way models: dragging or resizing updates them, and setting them programmatically moves or resizes the open window — see [Live vs. one-shot inputs](#live-vs-one-shot-inputs).

### Modal window

```html
<mona-window title="Settings" [modal]="true"> </mona-window>
```

`modal` (default `false`) adds a backdrop behind the window and traps focus inside it while open. Non-modal windows (the default) do not trap focus — the user can Tab out to the rest of the page.

### Preventing a close

```typescript
protected onClose(event: PopupCloseEvent): void {
    if (this.hasUnsavedChanges()) {
        event.preventDefault();
        return;
    }
    this.windowVisible.set(false);
}
```

```html
<mona-window (close)="onClose($event)"> </mona-window>
```

This works for both declarative and imperative usage. `WindowSettings.preventClose` is an alternative available only through `WindowService.open()` — see [`preventClose` is service-only](#preventclose-is-service-only).

### Imperative usage with a dynamic content template

```typescript
protected readonly dynamicContent = viewChild<TemplateRef<unknown>>("dynamicContent");
protected windowRef: WindowRef | null = null;

open(): void {
    this.windowRef = this.windowService.open({
        title: "Details",
        content: this.dynamicContent()
    });
}
```

## Technical & Behavior Notes

### Live vs. one-shot inputs

`top`, `left`, `width`, and `height` are `model()` signals kept reactive for the lifetime of the window: setting any of them after the window opens moves or resizes it immediately, and dragging or resizing updates them back.

Every other input (`closable`, `closeOnEscape`, `draggable`, `focusedElement`, `look`, `maxHeight`, `maxWidth`, `maximizable`, `minHeight`, `minWidth`, `minimizable`, `modal`, `resizable`, `rounded`, `title`, and every `*Template` projected via content) is read once when the window opens. Changing them afterward has no effect on the already-open window.

### `openWindow()` is not for reopening

`WindowComponent` exposes a public `openWindow()` method, called automatically once after the component's first render. Calling it again does not close the window that is already open — it opens an additional `WindowReference` and the component loses its reference to the first one, which is left open and unmanaged. Avoid calling it manually unless the window has already been closed.

### `preventClose` is service-only

`WindowSettings.preventClose` has no equivalent input on `<mona-window>`. It is only available through `WindowService.open()`. To conditionally block a close when using the declarative element, cancel it from a `(close)` handler instead — see [Preventing a close](#preventing-a-close).

### Positioning

If `top` and `left` are both omitted, the window is centered in the viewport when it opens. Providing either one switches to that fixed pixel position.

### `close` fires for every close path

`close` emits for the close (X) button, the Escape key, and any programmatic close — including a `preventClose` callback that returns `false`. Call `event.preventDefault()` synchronously inside a `close` handler to cancel any of these, the same way `PopupRef.beforeClose` works (see the Popup documentation's [Preventing a close](/components/popup#preventing-a-close) section, since Window is built on the same mechanism).

## Accessibility & Forms Integration

### Keyboard

The Escape key closes the window when `closeOnEscape` is `true` (the default). The title bar (when `draggable` is `true`) and each resize handle (when `resizable` is `true`) are focusable and respond to `ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight` to move or resize the window; hold Shift for a 1px step instead of the default 10px.

### Focus

Window only traps focus while `modal` is `true`. When it opens, focus moves automatically to the first focusable element, unless `focusedElement` is provided, in which case focus moves there instead. This auto-focus-in happens regardless of `modal`.

### ARIA

| Attribute         | When present | Value                                                                                   |
|-------------------|--------------|-----------------------------------------------------------------------------------------|
| `role`            | Always       | `"dialog"`                                                                              |
| `aria-labelledby` | Always       | ID of the title element (rendered even when a custom `monaWindowTitleTemplate` is used) |
| `aria-modal`      | Always       | Reflects the `modal` input (`"true"` or `"false"`)                                      |

Each generated header button (`Minimize`, `Maximize`/`Restore`, `Close window`) has its own `aria-label`. The draggable title bar and each resize handle also carry a descriptive `aria-label` (e.g. `"Move window. Use arrow keys to move."`).

Form integration is not applicable — Window is a container, not a form control.

## API

### `WindowComponent`

**Selector:** `mona-window`

#### Inputs

| Name             | Type                                                       | Default     | Description                                                                                                                    |
|------------------|------------------------------------------------------------|-------------|--------------------------------------------------------------------------------------------------------------------------------|
| `closable`       | `boolean`                                                  | `true`      | Sets the visibility of the close button in the window header.                                                                  |
| `closeOnEscape`  | `boolean`                                                  | `true`      | Sets whether the window should close when the escape key is pressed.                                                           |
| `draggable`      | `boolean`                                                  | `true`      | Sets whether the window can be dragged by the user.                                                                            |
| `focusedElement` | `HTMLElement \| ElementRef<HTMLElement> \| string \| null` | —           | Sets the element that should receive focus when the window is opened. Accepts an element reference or a query selector string. |
| `height`         | `number`                                                   | —           | Two-way bindable. Sets the height of the window.                                                                               |
| `left`           | `number`                                                   | —           | Two-way bindable. Sets the left position of the window.                                                                        |
| `look`           | `"default" \| "primary"`                                   | `"default"` | Sets the look of the window.                                                                                                   |
| `maxHeight`      | `number`                                                   | —           | Sets the maximum height of the window.                                                                                         |
| `maxWidth`       | `number`                                                   | —           | Sets the maximum width of the window.                                                                                          |
| `maximizable`    | `boolean`                                                  | `true`      | Sets whether the user can maximize the window.                                                                                 |
| `minHeight`      | `number`                                                   | —           | Sets the minimum height of the window.                                                                                         |
| `minWidth`       | `number`                                                   | —           | Sets the minimum width of the window.                                                                                          |
| `minimizable`    | `boolean`                                                  | `true`      | Sets whether the user can minimize the window.                                                                                 |
| `modal`          | `boolean`                                                  | `false`     | Sets whether the window should have an overlay behind it. Also controls focus trapping — see [Focus](#focus).                  |
| `resizable`      | `boolean`                                                  | `false`     | Sets whether the user can resize the window.                                                                                   |
| `rounded`        | `"none" \| "small" \| "medium" \| "large"`                 | `"medium"`  | Sets the border radius of the window.                                                                                          |
| `title`          | `string`                                                   | —           | Sets the title of the window.                                                                                                  |
| `top`            | `number`                                                   | —           | Two-way bindable. Sets the top position of the window.                                                                         |
| `width`          | `number`                                                   | —           | Two-way bindable. Sets the width of the window.                                                                                |

#### Outputs

| Name        | Type              | Description                                                                                                                             |
|-------------|-------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| `close`     | `PopupCloseEvent` | Emits when the window is about to be closed. Preventable — see [`close` fires for every close path](#close-fires-for-every-close-path). |
| `closed`    | `void`            | Emitted after the window has fully closed (post-animation). Preventing this event has no effect.                                        |
| `dragEnd`   | `void`            | Emits when the window dragging ends.                                                                                                    |
| `dragStart` | `void`            | Emits when the window dragging starts.                                                                                                  |

#### Public methods

| Name                                                            | Description                                                                                                                                                                  |
|-----------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `closeWindow(): void`                                           | Closes the window.                                                                                                                                                           |
| `move(position: { top?: number; left?: number }): void`         | Moves the window to the given position, in pixels. An omitted axis is left unchanged.                                                                                        |
| `openWindow(): void`                                            | Opens the window. Called automatically once after the first render — see [`openWindow()` is not for reopening](#openwindow-is-not-for-reopening) before calling it manually. |
| `resize(dimensions: { width?: number; height?: number }): void` | Resizes the window to the given dimensions, in pixels. An omitted dimension is left unchanged.                                                                               |

---

### `WindowService`

Injectable service, `providedIn: "root"`.

#### Public methods

| Name                                        | Description                                 |
|---------------------------------------------|---------------------------------------------|
| `open(settings: WindowSettings): WindowRef` | Opens a window and returns its `WindowRef`. |

---

### `WindowRef<R = unknown>`

Returned by `WindowService.open()`.

#### Public methods

| Name                                                                          | Description                                               |
|-------------------------------------------------------------------------------|-----------------------------------------------------------|
| `center(): void`                                                              | Centers the window in the viewport at its current size.   |
| `close(result?: R): void`                                                     | Closes the window, optionally carrying a result value.    |
| `closeWithDelay(delay: number, result?: R): void`                             | Closes the window after the given delay, in milliseconds. |
| `move(params: { top?: number; left?: number }): void`                         | Moves the window to the given position, in pixels.        |
| `resize(params: { width?: number; height?: number; center?: boolean }): void` | Resizes the window, optionally re-centering it afterward. |

#### Properties

| Name         | Type                             | Description                                                                               |
|--------------|----------------------------------|-------------------------------------------------------------------------------------------|
| `close$`     | `Observable<PopupCloseEvent<R>>` | Emits before any close proceeds.                                                          |
| `closed$`    | `Observable<void>`               | Emits once the window has fully closed.                                                   |
| `component`  | `ComponentRef<unknown> \| null`  | The hosted component instance, when `content` is a component rather than a `TemplateRef`. |
| `drag$`      | `Observable<MoveEvent>`          | Emits `{ top, left }` continuously while the window is being dragged.                     |
| `dragEnd$`   | `Observable<void>`               | Emits once when a drag gesture ends.                                                      |
| `dragStart$` | `Observable<void>`               | Emits once when a drag gesture starts.                                                    |
| `element`    | `HTMLElement`                    | The window's overlay element.                                                             |
| `height`     | `number`                         | The window's current rendered height, in pixels.                                          |
| `popupRef`   | `PopupRef`                       | The underlying `PopupRef`, for advanced overlay access.                                   |
| `resize$`    | `Observable<ResizeEvent>`        | Emits `{ width, height, top, left }` continuously while the window is being resized.      |
| `width`      | `number`                         | The window's current rendered width, in pixels.                                           |

---

### Exported Types

#### `WindowSettings`

The settings object accepted by `WindowService.open()`. Fields mirror the `WindowComponent` inputs of the same name (`closable`, `closeOnEscape`, `draggable`, `focusedElement`, `height`, `left`, `look`, `maxHeight`, `maxWidth`, `maximizable`, `minHeight`, `minWidth`, `minimizable`, `modal`, `resizable`, `rounded`, `top`, `width`), plus these service-only fields:

| Field            | Type                                       | Description                                                                                                                   |
|------------------|--------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| `actionTemplate` | `TemplateRef<WindowActionTemplateContext>` | Template rendered next to the minimize/maximize/close buttons.                                                                |
| `content`        | `TemplateRef<unknown> \| Type<unknown>`    | The window's content — a template reference or a component class.                                                             |
| `footerTemplate` | `TemplateRef<unknown>`                     | Template rendered in the window's footer area.                                                                                |
| `preventClose`   | `(event: PopupCloseEvent) => boolean`      | Return `true` to cancel a close from a built-in trigger. See [`preventClose` is service-only](#preventclose-is-service-only). |
| `title`          | `string \| TemplateRef<unknown>`           | The window's title — a plain string or a template reference.                                                                  |
| `windowClass`    | `string \| string[]`                       | Class(es) applied to the window's overlay element.                                                                            |

#### `WindowActionTemplateContext`

| Field       | Type        | Description                                                                                |
|-------------|-------------|--------------------------------------------------------------------------------------------|
| `$implicit` | `WindowRef` | The window's own `WindowRef`, exposed to a `monaWindowActionTemplate` via `let-windowRef`. |

#### `MoveEvent`

`{ top: number; left: number }` — the value emitted by `WindowRef.drag$`.

#### `ResizeEvent`

`{ top: number; left: number; width: number; height: number }` — the value emitted by `WindowRef.resize$`.

---

<!-- verification-checklist
- [x] WindowComponent inputs and defaults verified against window.component.ts source, including the two effect()s covering top/left and height/width, and the one-shot #openWindow() body for every other input
- [x] WindowComponent outputs verified (close: PopupCloseEvent, closed: void, dragEnd: void, dragStart: void) against window.component.ts source
- [x] WindowComponent public methods (closeWindow, move, openWindow, resize) verified against window.component.ts source; openWindow() re-entrancy footgun verified by reading #openWindow() reassigning #windowRef without closing the previous WindowReference
- [x] Live vs. one-shot input split verified directly against the two effect() bodies vs. #openWindow() body in window.component.ts
- [x] WindowService.open() verified as the only public method
- [x] WindowRef public methods/properties verified against models/WindowRef.ts and WindowRefParams.ts, including the closeWithDelay addition
- [x] WindowActionTemplateContext, MoveEvent, ResizeEvent verified exported via index.ts (added during the prior audit-fix session) and cross-checked against their model files
- [x] Four structural template directives verified against directives/*.ts and window-content.component.html; only WindowActionTemplateDirective's context confirmed (WindowActionTemplateContext, via ngTemplateOutletContext in the template)
- [x] modal defaulting to false and gating both the backdrop (WindowService.open's hasBackdrop) and the focus trap (WindowContentComponent's trapFocus.enabled = windowData.modal ?? false) verified against source from the prior audit-fix session
- [x] preventClose confirmed reachable only via WindowSettings/WindowService.open — no corresponding WindowComponent input exists in window.component.ts
- [x] close firing for every close path verified against WindowContentComponent.closeWindow() and PopupReference.close()/WindowReference.close()
- [x] role="dialog"/aria-labelledby/aria-modal verified against window-content.component.ts host bindings
- [x] Keyboard drag/resize (arrow keys, Shift for 1px step) and handle aria-labels verified against window-drag-handler.directive.ts, window-resize-handler.directive.ts, and window-content.component.html (added during the prior audit-fix session); pointerdown/pointermove/pointerup (not mouse*) verified as the current event names
- [x] Escape-key close and centering-when-top/left-omitted verified against window.service.ts and utils/setWindowStyles.ts
- [x] component-metadata.json regenerated via `npm run build:metadata` and cross-checked for the `closed` output and current descriptions
- [x] No internal-only symbols (WindowContentComponent, WindowInjectorData, WindowReference, WindowReferenceOptions, WindowRefParams, WindowResizeHandlerDirection, ResizePositionPipe, the drag/resize handler directives) documented as public API
-->
