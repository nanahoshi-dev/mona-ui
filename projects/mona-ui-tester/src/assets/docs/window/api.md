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
<mona-window title="Details" [resizable]="true" (closed)="windowVisible.set(false)">
    <p>Window content goes here.</p>
</mona-window>
}
```

`WindowComponent` opens automatically once its host renders, and whatever is placed inside it is the window's content. There is no explicit `open()` call for declarative usage — see [Reopening with `openWindow()`](#reopening-with-openwindow).

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
| -------------------------------- | ---------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| `WindowTitleTemplateDirective`   | `ng-template[monaWindowTitleTemplate]`   | None                                                       | The `title` input                                                |
| `WindowContentTemplateDirective` | `ng-template[monaWindowContentTemplate]` | None                                                       | Content placed directly inside `<mona-window>`                   |
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

Content placed directly inside `<mona-window>`, outside these templates, is the window's content. A `monaWindowContentTemplate` takes its place when given; use it when the content should only be created once the window opens. `WindowService.open()` instead takes `content` as a `TemplateRef` or a component type directly on `WindowSettings`.

## Feature Examples

### Draggable and resizable

```html
<mona-window title="Details" [draggable]="true" [resizable]="true"> </mona-window>
```

On `<mona-window>`, `draggable` defaults to `true` and `resizable` to `false`. Through `WindowService.open()`, both default to `false`. The pointer drags the window by its title bar and resizes it from eight edge and corner handles. A drag starts once the pointer has moved a few pixels with the primary button pressed, and never from the title bar's buttons or the controls of an action template. A dragged window keeps its size past the viewport's edges, and its title bar stays below the top edge. The keyboard does both from the title bar — see [Keyboard](#keyboard).

### Minimize and maximize

```html
<mona-window title="Details" [minimizable]="true" [maximizable]="true"> </mona-window>
```

Both default to `true` — set either to `false` to hide that button.

- **Minimize** collapses the window to its title bar and keeps its width. The content is hidden, not destroyed: form values, scroll positions and component state are all there after a restore. The minimize button becomes **Restore** while the window is minimized.
- **Maximize** fills the viewport, within `maxWidth` and `maxHeight`, and follows the viewport as it resizes. Double-clicking the title bar does the same when `maximizable` is `true`. **Restore** returns the window to the size and place it had. A maximized window can't be dragged or resized.

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

`modal` (default `false`) adds a backdrop behind the window, traps focus inside it, locks page scroll, and makes the rest of the page `inert` while it is open, so the pointer, Tab and screen readers can't reach it. Popups opened from inside the window stay usable. Non-modal windows (the default) do not trap focus — the user can Tab out to the rest of the page.

### Content from a component, with data

```typescript
@Component({
    template: `<p>{{ data.name }}</p>`
})
class UserWindowComponent {
    protected readonly data = inject<{ name: string }>(WINDOW_DATA);
    protected readonly windowRef = inject(WindowRef);
}

readonly #injector = inject(Injector);

open(): void {
    this.windowService.open({
        content: UserWindowComponent,
        data: { name: "Mona" },
        injector: this.#injector,
        title: "User"
    });
}
```

`data` reaches a component through the `WINDOW_DATA` token, and a template as its implicit context (`<ng-template #content let-data>`, with `let-windowRef="windowRef"` for its `WindowRef`). `injector` is the content's parent injector: pass the opener's so the component can inject what the opener provides. Without it, the content resolves from the root injector. `WindowRef.component` returns the hosted component.

### Preventing a close

```typescript
protected onClose(event: PopupCloseEvent): void {
    if (this.hasUnsavedChanges()) {
        event.preventDefault();
    }
}
```

```html
<mona-window (close)="onClose($event)" (closed)="windowVisible.set(false)"> </mona-window>
```

This works for both declarative and imperative usage (`WindowRef.close$`). `WindowSettings.preventClose` is an alternative available only through `WindowService.open()` — see [`preventClose` is service-only](#preventclose-is-service-only).

### Reading how a window closed

```typescript
const windowRef = this.windowService.open<string>({ title: "Rename", content: this.renameTemplate() });
windowRef.closed$.subscribe(({ value, via }) => {
    if (value) {
        this.rename(value);
    }
});
// From the content: windowRef.close(newName)
```

`closed$` emits a `WindowResult` once the window has closed: `value` is what was passed to `close(value)`, and `via` says what closed it.

## Technical & Behavior Notes

### Live vs. one-shot inputs

`top`, `left`, `width`, and `height` are `model()` signals kept reactive for the lifetime of the window: setting any of them after the window opens moves or resizes it immediately, and dragging or resizing updates them back.

Every other input (`ariaLabel`, `closable`, `closeOnEscape`, `draggable`, `focusedElement`, `look`, `maxHeight`, `maxWidth`, `maximizable`, `minHeight`, `minWidth`, `minimizable`, `modal`, `resizable`, `rounded`, `title`, the content, and every `*Template` projected via content) is read once when the window opens. Changing them afterward has no effect on the already-open window.

### Reopening with `openWindow()`

`WindowComponent` exposes a public `openWindow()` method, called automatically once after the component's first render. While the window is open, calling it does nothing. Once the window has closed (from its close button, Escape or `closeWindow()`) without the `<mona-window>` being removed, `openWindow()` opens it again.

### `preventClose` is service-only

`WindowSettings.preventClose` has no equivalent input on `<mona-window>`. It is only available through `WindowService.open()`, and it is asked once per close, whatever starts it. To conditionally block a close when using the declarative element, cancel it from a `(close)` handler instead — see [Preventing a close](#preventing-a-close).

### Positioning

`top` and `left` are pixels from the viewport's top-left corner, in left-to-right and right-to-left pages alike. Each axis is independent: an axis without a value is centered, and stays centered as the window's size changes. Dragging, resizing or moving the window with the keyboard fixes both axes where it is; `move()` fixes the axes it is given. `center()` centers both again. The window keeps its place when the text direction changes or the viewport resizes.

A window is capped to the viewport (`100dvw` by `100dvh`) unless `maxWidth` or `maxHeight` is set, and its body scrolls when the content is taller than the window.

### Stacking

Pressing or focusing a window raises it above the other open windows. Focus stays where it was inside it. A new window opens on top.

### The close contract

`close` (and `WindowRef.close$`) emits before any close — the close (X) button, the Escape key, a programmatic close, or the `<mona-window>` being destroyed. Call `event.preventDefault()` synchronously in a `close` handler to cancel it, the same way `PopupRef.beforeClose` works (see the Popup documentation's [Preventing a close](/components/popup#preventing-a-close) section, since Window is built on the same mechanism). A close caused by destroying the `<mona-window>` can't be kept, and its outputs don't emit.

`closed` (and `WindowRef.closed$`) emits once the leave animation has finished. `closed$` carries a `WindowResult` and replays it to late subscribers. When the window closes, `close$`, `closed$`, `drag$`, `dragStart$`, `dragEnd$` and `resize$` all complete.

## Accessibility & Forms Integration

### Keyboard

| Key                                                  | Where                           | Action                                                                                                         |
| ---------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `Escape`                                             | Anywhere in the window          | Closes it, when `closeOnEscape` is `true` (the default)                                                        |
| `ArrowUp` / `ArrowDown` / `ArrowLeft` / `ArrowRight` | The title bar, when `draggable` | Moves the window 10px, keeping all of it in the viewport                                                       |
| `Control` (or `Command`) + an arrow key              | The title bar, when `resizable` | Resizes the window 10px from its bottom and right edges, within its minimum and maximum sizes and the viewport |
| `Shift` with either of the above                     | The title bar                   | Moves or resizes 1px instead                                                                                   |

The title bar is one Tab stop when the window can be dragged or resized. Arrow keys pressed on its buttons, or on controls in an action template, are left to them. The resize handles are for the pointer and are not in the Tab order.

### Focus

Window only traps focus while `modal` is `true`. When it opens, focus moves automatically to the first focusable element, unless `focusedElement` is provided, in which case focus moves there instead. This auto-focus-in happens regardless of `modal`.

### ARIA

| Attribute         | When present                                      | Value                                            |
| ----------------- | ------------------------------------------------- | ------------------------------------------------ |
| `role`            | Always                                            | `"dialog"`                                       |
| `aria-labelledby` | When the window has a `title` or a title template | ID of the title element                          |
| `aria-label`      | When the window has no title                      | The `ariaLabel` input or setting                 |
| `aria-modal`      | Always                                            | `"true"` for a modal window, otherwise `"false"` |

Each generated header button (`Minimize`/`Restore`, `Maximize`/`Restore`, `Close window`) has its own `aria-label`. When the window can be dragged or resized, the title bar is a `group` named after the keys it takes (`moveWindow`, `resizeWindow` or `moveOrResizeWindow`, e.g. `"Move window. Use arrow keys to move."`). The resize handles are `aria-hidden`.

A window without a `title`, a title template or an `ariaLabel` has no accessible name. In development mode, such a window logs a warning.

Form integration is not applicable — Window is a container, not a form control.

## API

### `WindowComponent`

**Selector:** `mona-window`

#### Inputs

| Name             | Type                                                       | Default     | Description                                                                                                                                                     |
| ---------------- | ---------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel`      | `string`                                                   | —           | Accessible name for the window when it has no `title` or title template.                                                                                        |
| `closable`       | `boolean`                                                  | `true`      | Sets the visibility of the close button in the window header.                                                                                                   |
| `closeOnEscape`  | `boolean`                                                  | `true`      | Sets whether the window should close when the escape key is pressed.                                                                                            |
| `draggable`      | `boolean`                                                  | `true`      | Sets whether the window can be dragged by the user.                                                                                                             |
| `focusedElement` | `HTMLElement \| ElementRef<HTMLElement> \| string \| null` | —           | Sets the element that should receive focus when the window is opened. Accepts an element reference or a query selector string.                                  |
| `height`         | `number`                                                   | —           | Two-way bindable. Sets the height of the window.                                                                                                                |
| `left`           | `number`                                                   | —           | Two-way bindable. Sets the left position of the window.                                                                                                         |
| `look`           | `"default" \| "primary"`                                   | `"default"` | Sets the look of the window.                                                                                                                                    |
| `maxHeight`      | `number`                                                   | —           | Sets the maximum height of the window. Without it, the window is no taller than the viewport.                                                                   |
| `maxWidth`       | `number`                                                   | —           | Sets the maximum width of the window. Without it, the window is no wider than the viewport.                                                                     |
| `maximizable`    | `boolean`                                                  | `true`      | Sets whether the user can maximize the window.                                                                                                                  |
| `minHeight`      | `number`                                                   | —           | Sets the minimum height of the window.                                                                                                                          |
| `minWidth`       | `number`                                                   | —           | Sets the minimum width of the window.                                                                                                                           |
| `minimizable`    | `boolean`                                                  | `true`      | Sets whether the user can minimize the window.                                                                                                                  |
| `modal`          | `boolean`                                                  | `false`     | Sets whether the window should have an overlay behind it. Also controls focus trapping, the inert page and the scroll lock — see [Modal window](#modal-window). |
| `resizable`      | `boolean`                                                  | `false`     | Sets whether the user can resize the window.                                                                                                                    |
| `rounded`        | `"none" \| "small" \| "medium" \| "large"`                 | `"medium"`  | Sets the border radius of the window.                                                                                                                           |
| `title`          | `string`                                                   | —           | Sets the title of the window.                                                                                                                                   |
| `top`            | `number`                                                   | —           | Two-way bindable. Sets the top position of the window.                                                                                                          |
| `width`          | `number`                                                   | —           | Two-way bindable. Sets the width of the window.                                                                                                                 |

#### Outputs

| Name        | Type              | Description                                                                                      |
| ----------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| `close`     | `PopupCloseEvent` | Emits before the window closes. Preventable — see [The close contract](#the-close-contract).     |
| `closed`    | `void`            | Emitted after the window has fully closed (post-animation). Preventing this event has no effect. |
| `dragEnd`   | `void`            | Emits when the window dragging ends.                                                             |
| `dragStart` | `void`            | Emits when the window dragging starts.                                                           |

#### Public methods

| Name                                                            | Description                                                                                                                                                          |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `closeWindow(): void`                                           | Closes the window.                                                                                                                                                   |
| `move(position: { top?: number; left?: number }): void`         | Moves the window to the given position, in pixels. An omitted axis keeps its place.                                                                                  |
| `openWindow(): void`                                            | Opens the window. Called automatically once after the first render; does nothing while it is open — see [Reopening with `openWindow()`](#reopening-with-openwindow). |
| `resize(dimensions: { width?: number; height?: number }): void` | Resizes the window to the given dimensions, in pixels. An omitted dimension keeps its size.                                                                          |

---

### `WindowService`

Injectable service, `providedIn: "root"`.

#### Public methods

| Name                                                    | Description                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `open<R, D>(settings: WindowSettings<D>): WindowRef<R>` | Opens a window and returns its `WindowRef`. `R` is the type of the value passed to `close(value)`, and `D` the type of `data`. |

---

### `WindowRef<R = unknown>`

Returned by `WindowService.open()`, and injectable from a component given as `content`.

#### Public methods

| Name                                                                          | Description                                                                                                |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `center(): void`                                                              | Centers the window in the viewport. It stays centered as its size changes, until it is moved.              |
| `close(result?: R): void`                                                     | Closes the window, optionally carrying a value for `closed$`. `close$` can still prevent it.               |
| `closeWithDelay(delay: number, result?: R): void`                             | Closes the window after the given delay, in milliseconds.                                                  |
| `move(params: { top?: number; left?: number }): void`                         | Moves the window to the given position, in pixels. An omitted axis keeps its place.                        |
| `resize(params: { width?: number; height?: number; center?: boolean }): void` | Resizes the window, in pixels. An omitted dimension keeps its size; `center` centers the window afterward. |

#### Properties

| Name         | Type                             | Description                                                                                         |
| ------------ | -------------------------------- | --------------------------------------------------------------------------------------------------- |
| `close$`     | `Observable<PopupCloseEvent<R>>` | Emits before any close proceeds; preventable. Completes once the window has closed.                 |
| `closed$`    | `Observable<WindowResult<R>>`    | Emits how the window closed, once it has fully closed, then completes. Replays to late subscribers. |
| `component`  | `ComponentRef<unknown> \| null`  | The hosted component, when `content` is a component rather than a `TemplateRef`.                    |
| `drag$`      | `Observable<MoveEvent>`          | Emits `{ top, left }` while the window is being dragged. Completes when it closes.                  |
| `dragEnd$`   | `Observable<void>`               | Emits once when a drag ends. Completes when the window closes.                                      |
| `dragStart$` | `Observable<void>`               | Emits once when a drag starts. Completes when the window closes.                                    |
| `element`    | `HTMLElement`                    | The window's overlay element.                                                                       |
| `height`     | `number`                         | The window's current rendered height, in pixels.                                                    |
| `popupRef`   | `PopupRef`                       | The underlying `PopupRef`, for advanced overlay access.                                             |
| `resize$`    | `Observable<ResizeEvent>`        | Emits `{ width, height, top, left }` while the user resizes the window. Completes when it closes.   |
| `width`      | `number`                         | The window's current rendered width, in pixels.                                                     |

---

### Exported Types

#### `WindowSettings<D = unknown>`

The settings object accepted by `WindowService.open()`. Fields mirror the `WindowComponent` inputs of the same name (`ariaLabel`, `closable`, `closeOnEscape`, `draggable`, `focusedElement`, `height`, `left`, `look`, `maxHeight`, `maxWidth`, `maximizable`, `minHeight`, `minWidth`, `minimizable`, `modal`, `resizable`, `rounded`, `top`, `width`), all optional, plus these service-only fields:

| Field            | Type                                       | Description                                                                                           |
| ---------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `actionTemplate` | `TemplateRef<WindowActionTemplateContext>` | Template rendered next to the minimize/maximize/close buttons.                                        |
| `content`        | `TemplateRef<unknown> \| Type<unknown>`    | The window's content — a template reference or a component class.                                     |
| `data`           | `D`                                        | Data for the content: `WINDOW_DATA` in a component, the implicit context of a template.               |
| `footerTemplate` | `TemplateRef<unknown>`                     | Template rendered in the window's footer area.                                                        |
| `injector`       | `Injector`                                 | Parent injector for the content. Default: the root injector.                                          |
| `preventClose`   | `(event: PopupCloseEvent) => boolean`      | Return `true` to cancel a close. See [`preventClose` is service-only](#preventclose-is-service-only). |
| `title`          | `string \| TemplateRef<unknown>`           | The window's title — a plain string or a template reference.                                          |
| `windowClass`    | `string \| string[]`                       | Class(es) applied to the window's overlay element.                                                    |

#### `WindowResult<R = unknown>`

| Field   | Type               | Description                                                                                                |
| ------- | ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `value` | `R \| undefined`   | The value passed to `close(value)`; `undefined` for the close button, Escape and the host being destroyed. |
| `via`   | `PopupCloseSource` | What closed the window: the close button, Escape, or a programmatic close.                                 |

#### `WINDOW_DATA`

`InjectionToken<unknown>` — the `data` a window was opened with, for a component given as its `content`.

#### `WindowActionTemplateContext`

| Field       | Type        | Description                                                                                |
| ----------- | ----------- | ------------------------------------------------------------------------------------------ |
| `$implicit` | `WindowRef` | The window's own `WindowRef`, exposed to a `monaWindowActionTemplate` via `let-windowRef`. |

#### `MoveEvent`

`{ top: number; left: number }` — the value emitted by `WindowRef.drag$`.

#### `ResizeEvent`

`{ top: number; left: number; width: number; height: number }` — the value emitted by `WindowRef.resize$`.

---

<!-- verification-checklist
- [x] WindowComponent inputs and defaults verified against window.component.ts source, including the two effect()s covering top/left and height/width, and the one-shot #openWindow() body for every other input
- [x] WindowComponent outputs verified (close: PopupCloseEvent, closed: void, dragEnd: void, dragStart: void) against window.component.ts source
- [x] Batch 6 (module 11): projected content through the internal #projectedContent template, openWindow() being a no-op while open, single-call move()/resize(), and the silent destroy (#destroyed) verified against window.component.ts and tests/window-contract.spec.ts
- [x] Positioning through positionGlobalOverlay() (axis-independent centering, physical in RTL), the 100dvw/100dvh caps, shrink-0, blockScroll and inertOutside() for modal windows verified against window.service.ts and WindowReference.ts
- [x] Minimize ([hidden] + inert, the width kept, the minimize button becoming Restore) and maximize (100dvw/100dvh through updateSize, centered, restored to the saved size and placement) verified against window-content.component.ts/.html
- [x] Keyboard table verified against window-drag-handler.directive.ts (target check, clamps, Control/Command resize, Shift fine step); resize handles aria-hidden with no tabindex verified against window-content.component.html
- [x] Pointer drag (primary button, interactive targets skipped, 3px threshold, pointer capture, pointercancel) and the top-edge clamp verified against window-drag-handler.directive.ts; resize handles verified against window-resize-handler.directive.ts
- [x] Stacking verified against WindowReference.bringToFront() and the capture-phase pointerdown and focusin listeners in window-content.component.ts
- [x] closed$ (WindowResult, replayed) and the completion of close$, drag$, dragStart$, dragEnd$ and resize$ verified against WindowReference.ts
- [x] preventClose asked once verified: closeWindow() no longer calls it, PopupReference.close() does
- [x] WINDOW_DATA, data, injector and the template context ($implicit data, windowRef) verified against window.service.ts and window-content.component.html
- [x] ARIA (aria-labelledby only with a title, aria-label from ariaLabel, aria-modal, the title bar group and its three messages) and the dev-mode warning verified against window-content.component.ts/.html
- [x] WindowService.open<R, D>() verified as the only public method
- [x] WindowRef public methods/properties verified against models/WindowRef.ts and WindowRefParams.ts
- [x] WindowActionTemplateContext, MoveEvent, ResizeEvent, WindowResult and WINDOW_DATA verified exported via public-api.ts
- [x] Four structural template directives verified against directives/*.ts and window-content.component.html
- [x] component-metadata.json regenerated via `npm run build:metadata`
- [x] No internal-only symbols (WindowContentComponent, WindowInjectorData, WindowReference, WindowReferenceOptions, WindowRefParams, WindowResizeHandlerDirection, ResizePositionPipe, the drag/resize handler directives) documented as public API
-->
