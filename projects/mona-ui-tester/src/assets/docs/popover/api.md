## Overview & Component Selection

`PopoverComponent` (`mona-popover`) anchors a floating panel — with an optional title, footer, and projected body content — to a `target` element, and opens it via a configurable trigger. It is built on `PopupService` internally.

**Use Popover when you need:**

- A labeled content panel anchored to a trigger element, with explicit open/close control
- Title and/or footer regions around free-form projected content
- A panel the consumer can also open and close imperatively, via `open()` / `close()`

**Use a closely related Mona UI component instead when:**

- You only need a short hint shown on hover/focus — use `Tooltip`. Popover requires an explicit trigger configuration and renders a title/footer structure that Tooltip does not have.
- You need a list of actionable menu items — use `PopupMenu` or `ContextMenu`. Popover has no item model, keyboard item navigation, or selection state; its body is arbitrary projected content.
- You need a modal experience with a focus trap — use `Dialog` or `Window`. Popover does not trap focus and is dismissed by outside click or Escape by default.
- You need full control over positioning, backdrop, animation, or a popup that is not built from a fixed template — use `Popup` directly. Popover fixes several of `Popup`'s settings (see Technical & Behavior Notes).

## Import & Quick Start

```typescript
import { PopoverComponent } from "@nanahoshi/mona-ui";
```

```html
<button #anchor type="button">Open popover</button>
<mona-popover [target]="anchor" title="Title">
    <p class="p-2">Popover content</p>
</mona-popover>
```

`target` accepts a template reference variable (as above, resolving to the native element), an `ElementRef`, or a plain `Element`. The default `trigger` is `"click"`.

To call `open()` / `close()` from the template, capture a reference with `exportAs="monaPopover"`:

```html
<mona-popover #p="monaPopover" [target]="anchor">
    <p class="p-2">Popover content</p>
</mona-popover>
<button type="button" (click)="p.open()">Open</button>
<button type="button" (click)="p.close()">Close</button>
```

## Anatomy & Public Structural Templates

Content placed inside `<mona-popover>...</mona-popover>` — other than the template directives below — becomes the panel's body content.

| Directive selector                       | Purpose                                                                                              |
|------------------------------------------|------------------------------------------------------------------------------------------------------|
| `ng-template[monaPopoverTitleTemplate]`  | Replaces the plain-text `title` in the header. Takes precedence over `title` when both are provided. |
| `ng-template[monaPopoverFooterTemplate]` | Adds a footer region below the body content.                                                         |

Neither directive exposes a template context (no `let-` variables).

```html
<mona-popover [target]="anchor">
    <ng-template monaPopoverTitleTemplate>
        <div class="flex items-center justify-between p-2">
            <span>Custom Title</span>
        </div>
    </ng-template>
    <p class="p-2">Body content</p>
    <ng-template monaPopoverFooterTemplate>
        <div class="p-2 border-t border-t-border">Footer</div>
    </ng-template>
</mona-popover>
```

The header row — and the rounded top corners that go with it — only renders when `title` is non-empty or a title template is projected. The footer region only renders when a footer template is projected.

## Feature Examples

### Click trigger (default)

```html
<mona-popover [target]="anchor" title="Details">
    <p class="p-2">Click the target again, or click outside, to close.</p>
</mona-popover>
```

Clicking the target toggles the popover — a second click on the same target closes it instead of opening a duplicate.

### Hover trigger

```html
<mona-popover [target]="anchor" trigger="hover">
    <p class="p-2">Opens on pointer enter, closes on pointer leave.</p>
</mona-popover>
```

### Manual trigger

```html
<mona-popover #p="monaPopover" [target]="anchor" trigger="none">
    <p class="p-2">Opened and closed only through p.open() / p.close().</p>
</mona-popover>
<button type="button" (click)="p.open()">Open</button>
```

### Position and arrow

```html
<mona-popover [target]="anchor" position="right" [displayArrow]="true">
    <p class="p-2">Anchored to the right, with a pointing arrow.</p>
</mona-popover>
```

### Preventing a close

```typescript
import type { PopoverHideEvent } from "@nanahoshi/mona-ui";

protected onHide(event: PopoverHideEvent): void {
    if (!this.canClose()) {
        event.preventDefault();
    }
}
```

```html
<mona-popover [target]="anchor" (hide)="onHide($event)">
    <p class="p-2">Popover content</p>
</mona-popover>
```

`preventDefault()` on the `hide` event cancels the close regardless of what triggered it — a second click on the target, a direct `close()` call, an outside click, or Escape. The popover stays open and its internal open/closed tracking remains consistent in every case.

## Technical & Behavior Notes

**The triggering DOM event's default action is suppressed.** For every `trigger` value except `"hover"` and `"none"`, the component calls `event.preventDefault()` on the event that opens or closes the popover. If `target` is a native element whose default action matters — an `<a href>`, a submit button, a checkbox — that default action will not run while the popover trigger is attached to the same event.

**`trigger` accepts more than the three documented values.** `PopoverTrigger` is `"click" | "hover" | "none"` plus any other string. Any DOM event name dispatched on the target (for example `"contextmenu"`) opens the popover the same way `"click"` does. Only `"hover"` gets pointer-enter/pointer-leave handling, and only `"none"` disables automatic triggering.

**Outside click and Escape close the popover by default**, and this is not configurable through Popover's public API — `closeOnOutsideClick` is fixed to `true`, and `closeOnEscape` is left at `PopupService`'s default of `true`.

**Positioning has no fallback/flip.** `position` selects a single anchor/popup connection-point pair; the popup is pushed back into the viewport if it would overflow (`withPush: true`, fixed), but it does not flip to the opposite side the way some popups with multiple candidate positions do.

**Several `Popup` settings are fixed, not exposed as Popover inputs:** there is no backdrop (`hasBackdrop: false`), the animation is always the fade preset, and `restoreFocus` is fixed to `"auto"`. Use `Popup` directly if you need to configure these.

**Calling `open()` while already open is a no-op.** It only has an effect when the popover is currently closed.

**`open()` does not emit `show`/`shown`; `close()` does emit `hide`.** `show` and `shown` are only emitted by the trigger-driven open path, not by calling `open()` directly. `close()` — and a trigger-driven toggle-close — both route through the same popup-level close handling, which emits `hide` exactly once per close attempt, regardless of what initiated it.

**The component's internal open/closed tracking only updates once the popup has actually closed.** Calling `close()` does not clear it immediately; it is cleared after the popup finishes closing. If a `hide` listener calls `event.preventDefault()`, the popup stays open and the internal tracking still reflects "open," so a subsequent `open()` call remains a correct no-op instead of creating a duplicate popup.

## Accessibility & Forms Integration

### Keyboard

| Key    | Action                                                                                                      |
|--------|-------------------------------------------------------------------------------------------------------------|
| Escape | Closes the popover (handled by the underlying popup service; not configurable through Popover's public API) |

No other keyboard handling is implemented by `PopoverComponent` itself. If `target` is a native interactive element (for example a `<button>`), its own keyboard activation (Enter / Space) already dispatches the `click` event that the default trigger listens for.

### ARIA

**Target element** (the element bound to `target`):

| Attribute       | When present                                 | Value                                        |
|-----------------|----------------------------------------------|----------------------------------------------|
| `aria-haspopup` | From the first time the popover opens onward | `"dialog"`                                   |
| `aria-controls` | From the first time the popover opens onward | The panel's auto-generated id                |
| `aria-expanded` | From the first time the popover opens onward | `"true"` while open, `"false"` after closing |

These attributes are not present on the target before the popover has opened at least once.

**Panel:**

| Attribute         | When present                                               | Value                                                |
|-------------------|------------------------------------------------------------|------------------------------------------------------|
| `role`            | Always                                                     | `"dialog"`                                           |
| `id`              | Always                                                     | Auto-generated, matches the target's `aria-controls` |
| `aria-labelledby` | When `title` is non-empty or a title template is projected | The header element's auto-generated id               |

### Focus

`PopoverComponent` does not implement a focus trap — it is a non-modal panel. Focus restoration to the target on close follows `Popup`'s `"auto"` behavior: focus returns to the target only if the target itself held focus immediately before the popover opened. This is not configurable through Popover's public API.

**Consumer responsibilities:**

- Provide an accessible name for the `target` element itself (visible text, or its own `aria-label`) — Popover does not add one.
- `role="dialog"` is rendered without `aria-modal`. If your use case requires a modal, focus-trapped experience, use `Dialog` or `Window` instead.

## API

### `PopoverComponent`

**Selector:** `mona-popover` · **`exportAs`:** `monaPopover`

#### Inputs

| Name           | Type                                       | Default    | Description                                                                                            |
|----------------|--------------------------------------------|------------|--------------------------------------------------------------------------------------------------------|
| `displayArrow` | `boolean`                                  | `false`    | Renders a small arrow pointing from the panel toward the target, on the side specified by `position`.  |
| `position`     | `"top" \| "right" \| "bottom" \| "left"`¹  | `"top"`    | Side of the target the panel is anchored to.                                                           |
| `rounded`      | `'none' \| 'small' \| 'medium' \| 'large'` | `'medium'` | Border-radius preset applied to the panel, and to the header's top corners when a header is rendered.  |
| `target`       | `Element \| ElementRef`                    | —          | Required. The element the popover is anchored to and listens for the trigger event on.                 |
| `title`        | `string`                                   | `''`       | Plain-text title shown in the header. Ignored when a `monaPopoverTitleTemplate` is projected.          |
| `trigger`      | `PopoverTrigger`                           | `'click'`  | The event that opens/closes the popover. See [Technical & Behavior Notes](#technical--behavior-notes). |

¹ Exposed publicly via the `Position` type, which is referenced by this input but not exported from `@nanahoshi/mona-ui`. <!-- TODO(owner-review): confirm whether Position should be exported. -->

#### Outputs

| Name     | Type                | Description                                                                                                                                                                                                          |
|----------|---------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `hide`   | `PopoverHideEvent`  | Emitted before the popover closes — by the trigger, `close()`, an outside click, or Escape. Call `event.preventDefault()` to cancel the close. See the close-event notes below and in Technical & Behavior Notes.    |
| `hidden` | `void`              | Emitted after the popover has fully closed. Not emitted if a `hide` listener canceled the close.                                                                                                                     |
| `show`   | `PopoverShowEvent`  | Emitted before the popover opens through its configured trigger. Call `event.preventDefault()` to cancel the open. **Not emitted when opening through the public `open()` method** — see Technical & Behavior Notes. |
| `shown`  | `PopoverShownEvent` | Emitted after the popover has opened through its configured trigger. **Not emitted when opening through `open()`** — see Technical & Behavior Notes.                                                                 |

#### Public methods

| Name            | Description                                                                                                                                                                                    |
|-----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `close(): void` | Closes the popover if one is currently open. Emits `hide` and respects `preventDefault()` — if canceled, the popup stays open and the component's internal state remains consistent with that. |
| `open(): void`  | Opens the popover directly. No-op if it is already open. Does not emit `show` or `shown`.                                                                                                      |

---

### `PopoverTitleTemplateDirective`

**Selector:** `ng-template[monaPopoverTitleTemplate]`

Marks an `ng-template` as the popover's custom title content. No inputs, outputs, or template context.

---

### `PopoverFooterTemplateDirective`

**Selector:** `ng-template[monaPopoverFooterTemplate]`

Marks an `ng-template` as the popover's custom footer content. No inputs, outputs, or template context.

---

### Exported Types

#### `PopoverTrigger`

```typescript
type PopoverTrigger = "click" | "hover" | "none" | (string & {});
```

`"click"`, `"hover"`, and `"none"` get autocomplete; any other string is also accepted and used as a raw DOM event name (see Technical & Behavior Notes).

#### `PopoverShowEvent`

Extends `PreventableEvent`.

| Property | Type      | Description                             |
|----------|-----------|-----------------------------------------|
| `target` | `Element` | The element the popover is anchored to. |

#### `PopoverHideEvent`

Extends `PreventableEvent`.

| Property   | Type       | Description                             |
|------------|------------|-----------------------------------------|
| `popupRef` | `PopupRef` | Reference to the popup being closed.    |
| `target`   | `Element`  | The element the popover is anchored to. |

#### `PopoverShownEvent`

| Property   | Type       | Description                             |
|------------|------------|-----------------------------------------|
| `popupRef` | `PopupRef` | Reference to the popup that was opened. |
| `target`   | `Element`  | The element the popover is anchored to. |

`PreventableEvent` (the base class of `PopoverShowEvent` and `PopoverHideEvent`) exposes `preventDefault(): void` and `isDefaultPrevented(): boolean`.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against popover.component.ts source and component-metadata.json (regenerated via `npm run build:metadata`)
- [x] trigger documented as PopoverTrigger ("click" | "hover" | "none" | raw event name); PopoverTrigger confirmed newly exported from lib/index.ts (was previously unexported — added as part of this doc pass)
- [x] preventDefault() on the triggering event verified in setSubscriptions() for all non-hover/non-none trigger values
- [x] closeOnOutsideClick: true and closeOnMouseLeave: trigger === "hover" verified in createPopover()'s PopupService.create() call
- [x] closeOnEscape not set by Popover; verified PopupService.setupEscapeKeyListener() defaults to true when settings.closeOnEscape is undefined
- [x] restoreFocus not set by Popover (defaults to PopupSettings "auto"); hasBackdrop: false and fixed fadePopupAnimation verified
- [x] No custom `positions` array passed — single anchor/popup connection-point pair from position, withPush: true, no flip strategy
- [x] open() no-op-when-open verified; open() confirmed NOT to emit show/shown (only #openViaTrigger does) — corrected from an earlier draft that incorrectly claimed close() bypasses hide's preventDefault
- [x] close() traced end-to-end through PopupRef.close() -> PopupReference.close() -> beforeClosed$.next(): confirmed close() DOES emit hide via the beforeClose subscription in #createPopover(), and IS preventable at the PopupReference level
- [x] close() state-desync bug (PopoverComponent.close() nulling this.popupRef unconditionally even when the resulting hide was canceled) fixed: this.popupRef is now only cleared in the popupRef.closed subscription, once the popup has actually finished closing
- [x] Double hide-emission bug on trigger-driven toggle-close (the trigger's filter() calling #closePopup(), which emitted hide directly and then called close(), re-triggering a second emission via the beforeClose subscription) fixed: the toggle-close path now calls close() directly and relies solely on the beforeClose-driven hide emission in #createPopover()
- [x] Both fixes covered by new specs in popover.component.spec.ts: a canceled hide from a direct close() call leaves aria-expanded="true" and does not emit hidden; a trigger-driven toggle-close emits hide exactly once
- [x] ARIA attributes on target (aria-haspopup="dialog", aria-controls, aria-expanded) verified set/cleared via Renderer2 in createPopover()/popupRef.closed
- [x] Panel role="dialog", id, and conditional aria-labelledby verified in popover.component.html and the headerId computed signal
- [x] No focus trap confirmed; restoreFocus "auto" semantics cross-referenced against assets/docs/popup/api.md
- [x] Escape keyboard behavior is PopupService-level, not Popover-implemented — documented accordingly, no invented keyboard map beyond Escape
- [x] PopoverTitleTemplateDirective / PopoverFooterTemplateDirective confirmed to have no inputs, outputs, or template context
- [x] Position type confirmed referenced by the position input but not exported from lib/index.ts — flagged TODO(owner-review)
- [x] PopupRef and PreventableEvent confirmed exported from lib/index.ts
- [x] No internal or unexported APIs exposed beyond the documented TODO
- [x] API tables sorted A→Z within each section
- [x] Basic examples compile against the public API surface
-->
