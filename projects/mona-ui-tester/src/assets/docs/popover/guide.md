## Overview

`PopoverComponent` (`mona-popover`) anchors a floating panel — with an optional title, footer, and projected body content — to a `target` element, and opens it via a configurable trigger. It is built on `PopupService` internally.

**Use Popover when you need:**

- A labeled content panel anchored to a trigger element, with explicit open/close control
- Title and/or footer regions around free-form projected content
- A panel the consumer can also open and close imperatively, via `open()` / `close()`

**Use a closely related Mona UI component instead when:**

- You only need a short hint shown on hover/focus — use `Tooltip`. Popover requires an explicit trigger configuration and renders a title/footer structure that Tooltip does not have.
- You need a list of actionable menu items — use `PopupMenu` or `ContextMenu`. Popover has no item model, keyboard item navigation, or selection state; its body is arbitrary projected content.
- You need a modal experience with a focus trap — use `Dialog` or `Window`. Popover moves focus into itself when it opens, but doesn't trap it, and is dismissed by outside click or Escape by default.
- You need full control over positioning, backdrop, animation, or a popup that is not built from a fixed template — use `Popup` directly. Popover fixes several of `Popup`'s settings (see [Behavior](#behavior)).

## Import & Quick Start

```typescript
import { PopoverComponent } from "@nanahoshi/mona-ui/popover";
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

## Anatomy

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

## Examples

### Click trigger (default)

Clicking the target toggles the popover — a second click on the same target closes it instead of opening a duplicate. The footer's button closes it through the `monaPopover` reference.

```example
popover/basic
```

### Hover trigger

```example
popover/hover
```

A hover popover opens when the pointer moves onto the target or keyboard focus enters it. It closes once both have left the target and the panel, after a grace of about 100 ms that lets the pointer move onto the panel. Touch pointers don't open it. A hover popover doesn't take focus when it opens, unless `autoFocus` is set.

### Manual trigger

```html
<mona-popover #p="monaPopover" [target]="anchor" trigger="none">
    <p class="p-2">Opened and closed only through p.open() / p.close().</p>
</mona-popover>
<button type="button" (click)="p.open()">Open</button>
```

### Position and arrow

The hover example above opens after its target in the reading direction (`position="end"`), with `[displayArrow]="true"`. `position` is `"top"` (default), `"bottom"`, `"left"`, `"right"`, `"start"` or `"end"`. `left` and `right` are physical sides in both directions; `start` and `end` follow the text direction. When there isn't room, the popover flips to the opposite side, and its arrow follows.

### Popover without a visible title

```example
popover/no-title
```

A popover is a dialog, and needs a name: a `title`, a title template, or `aria-label`. In dev mode, a popover that opens without one logs a warning.

### Preventing a close

```typescript
import type { PopoverHideEvent } from "@nanahoshi/mona-ui/popover";

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

## Behavior

**The triggering DOM event keeps its default action.** A link, a checkbox or a submit button can be the target, and still navigates, toggles or submits. The one exception is `trigger="contextmenu"`, whose default (the browser's own menu) would cover the popover.

**`trigger` accepts more than the three documented values.** `PopoverTrigger` is `"click" | "hover" | "none"` plus any other string. Any DOM event name dispatched on the target (for example `"contextmenu"`) toggles the popover the same way `"click"` does. Only `"hover"` gets pointer and focus handling, and only `"none"` disables automatic triggering.

**Outside click and Escape close the popover by default.** Set `closeOnOutsideClick` or `closeOnEscape` to `false` to turn either off. A click on the target itself is never an outside click.

**Positioning flips.** The popover opens on the side `position` names, and flips to the opposite side when there isn't room. It is then pushed back into the viewport if it still overflows.

**Several `Popup` settings are fixed, not exposed as Popover inputs:** there is no backdrop, the animation is always the fade preset, and focus is restored to the target on close only if the target held focus when the popover opened. Use `Popup` directly if you need to configure these.

**Calling `open()` while already open is a no-op.** It only has an effect when the popover is currently closed.

**`open()` does not emit `show`.** `show` is only emitted by the trigger-driven open path, so it can be prevented. `shown` is emitted once the popover has opened, however it was opened. `close()` — and a trigger-driven toggle-close — both route through the same popup-level close handling, which emits `hide` exactly once per close attempt, regardless of what initiated it.

**The component's internal open/closed tracking only updates once the popup has actually closed.** Calling `close()` does not clear it immediately; it is cleared after the popup finishes closing. If a `hide` listener calls `event.preventDefault()`, the popup stays open and the internal tracking still reflects "open," so a subsequent `open()` call remains a correct no-op instead of creating a duplicate popup.

**Destroying the popover closes it**, without emitting `hide` or `hidden`, and removes the attributes it set on the target. Changing `target` moves those attributes to the new target.

- `"click"`, `"hover"`, and `"none"` get autocomplete; any other string is also accepted and used as a raw DOM event name (see Technical & Behavior Notes).

## Accessibility

### Keyboard

| Key    | Action                                                                                              |
|--------|-----------------------------------------------------------------------------------------------------|
| Escape | Closes the popover, unless `closeOnEscape` is `false`. Focus returns to the target if it was there. |
| Tab    | Moves through the popover's content, and on past it. Focus isn't trapped.                           |

If `target` is a native interactive element (for example a `<button>`), its own keyboard activation (Enter / Space) already dispatches the `click` event that the default trigger listens for.

### ARIA

**Target element** (the element bound to `target`):

| Attribute       | When present              | Value                                    |
|-----------------|---------------------------|------------------------------------------|
| `aria-haspopup` | From the start            | `"dialog"`                               |
| `aria-expanded` | From the start            | `"true"` while open, `"false"` otherwise |
| `aria-controls` | While the popover is open | The panel's auto-generated id            |

All three are removed when the popover is destroyed or its `target` changes.

**Panel:**

| Attribute         | When present                                               | Value                                                |
|-------------------|------------------------------------------------------------|------------------------------------------------------|
| `role`            | Always                                                     | `"dialog"`                                           |
| `id`              | Always                                                     | Auto-generated, matches the target's `aria-controls` |
| `aria-labelledby` | When `title` is non-empty or a title template is projected | The header element's auto-generated id               |
| `aria-label`      | When there's no title, and `aria-label` is set              | `aria-label`                                          |
| `tabindex`        | Always                                                     | `"-1"`, so the panel itself can take focus           |

### Focus

When a popover opens, focus moves to its first focusable element, or to the panel when it has none. A hover popover doesn't take focus. Set `autoFocus` to choose either way.

Popover is non-modal and doesn't trap focus: Tab moves on past its content, and focus can leave it freely. On close, focus returns to the target if the target held focus when the popover opened.

**Consumer responsibilities:**

- Provide an accessible name for the `target` element itself (visible text, or its own `aria-label`) — Popover does not add one.
- Name the popover with `title`, a title template, or `aria-label`.
- `role="dialog"` is rendered without `aria-modal`. If your use case requires a modal, focus-trapped experience, use `Dialog` or `Window` instead.

<!-- verification-checklist
- [x] API definitions and defaults verified against popover.component.ts source and component-metadata.json (regenerated via `npm run build:metadata`)
- [x] New inputs documented: ariaLabel, autoFocus (default: trigger !== "hover"), closeOnEscape, closeOnOutsideClick
- [x] trigger documented as PopoverTrigger; preventDefault() only for "contextmenu" (spec: a checkbox target still toggles)
- [x] Hover trigger documented from HoverIntent: pointer or focus, ~100 ms grace, panel hover keeps it open, touch ignored; closeOnMouseLeave no longer used
- [x] Positions from overlaySidePositions: the requested side plus its opposite, withPush kept; arrow follows positionChanges
- [x] RTL: left/right physical, start/end by direction (spec: "end" in RTL has a negative X gap)
- [x] open() emits shown but not show; shown emitted on the popup's opened stream
- [x] Destroy closes silently and removes target attributes; target changes move them (specs)
- [x] ARIA on target: aria-haspopup/aria-expanded from the start, aria-controls while open (specs)
- [x] Panel role="dialog", tabindex="-1", aria-labelledby or aria-label from popover.component.html; dev warning without a name
- [x] Focus moves to the first tabbable element or the panel on open, no trap; restoreFocus "auto"
- [x] PopoverTitleTemplateDirective / PopoverFooterTemplateDirective confirmed to have no inputs, outputs, or template context
- [x] PopoverPosition, PopupRef and PreventableEvent confirmed exported
- [x] API tables sorted A→Z within each section
- [x] Basic examples compile against the public API surface
-->
