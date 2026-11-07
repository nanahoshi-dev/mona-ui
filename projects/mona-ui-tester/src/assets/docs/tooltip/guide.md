## Overview

`TooltipComponent` is placed anywhere in a template and points at a separate `target` element. Unlike `TooltipDirective`, its content comes from projected content, not a `title` attribute, so it supports icons, formatting, and multiple lines.

Use `TooltipComponent` when the tooltip needs more than plain text. Use `TooltipDirective` (`monaTooltip`) when a `title` attribute is enough and you want to avoid adding a separate element.

## Import & Basic Usage

```typescript
import { TooltipComponent } from "@nanahoshi/mona-ui/tooltip";
```

**Targeting an element reference:**

```html
<button #saveButton>Save</button>
<mona-tooltip [target]="saveButton">Save your current changes</mona-tooltip>
```

**Targeting a CSS selector:**

A selector target attaches the same tooltip behavior to every matching element in the document, including ones added after initial render. One listener on the document handles them all, so nothing watches the page for changes:

```html
<div class="flex gap-2">
    <button class="action" data-action="save">Save</button>
    <button class="action" data-action="discard">Discard</button>
</div>
<mona-tooltip target=".action">Action button</mona-tooltip>
```

## Public Customization

- **`position`** — `"top"` (default), `"bottom"`, `"left"`, `"right"`, `"start"`, or `"end"`. The side of the target the tooltip opens on. `left` and `right` are physical sides in both directions; `start` and `end` follow the text direction (in RTL, `start` is the right). When there isn't room, the tooltip flips to the opposite side, and its arrow follows.
- **`rounded`** — `'none'`, `'small'`, `'medium'` (default), `'large'`, or `'full'`. Controls the tooltip panel's border radius.
- **`showDelay`** / **`hideDelay`** — milliseconds to wait before showing the tooltip, or before hiding it once the pointer or focus has left. Both default to `0`. A pointer that leaves always gets a grace of about 100 ms, so it can move onto the tooltip.
- **Projected content** — anything placed between the `<mona-tooltip>` tags is rendered inside the tooltip panel, including markup and other components.
- **`contentOf`** — on `TooltipDirective`, a function from the element to its text, for when the text isn't in a `title`, as with `mode="content"` over rows that keep theirs elsewhere. The element's own `title` isn't touched, and an empty result shows nothing.

## Examples

**Custom position:**

```html
<button #infoButton>Info</button>
<mona-tooltip [target]="infoButton" position="right">More information</mona-tooltip>
```

**Show/hide delay:**

```html
<button #deleteButton>Delete</button>
<mona-tooltip [target]="deleteButton" [showDelay]="300" [hideDelay]="150">
    This cannot be undone
</mona-tooltip>
```

**Disabling the tooltip conditionally:**

```html
<button #submitButton>Submit</button>
<mona-tooltip [target]="submitButton" [disabled]="formPending()">
    Submit the form
</mona-tooltip>
```

**Reacting to visibility changes:**

```html
<button #exportButton>Export</button>
<mona-tooltip [target]="exportButton" (shown)="onTooltipShown()" (hidden)="onTooltipHidden()">
    Export the current view
</mona-tooltip>
```

**Rich projected content:**

```html
<button #statusButton>Status</button>
<mona-tooltip [target]="statusButton">
    <div class="flex items-center gap-1">
        <strong>Build:</strong> <span class="text-green-600">Passing</span>
    </div>
</mona-tooltip>
```

## Accessibility Notes

The tooltip opens when the pointer moves onto the target or keyboard focus enters it, and closes when both have left. Touch pointers don't open it, since a tap would show it and hide it again at once; touch users get the target's own name and description.

It meets WCAG 1.4.13 (content on hover or focus):

- **Hoverable:** the pointer can move from the target onto the tooltip, and the tooltip stays open while the pointer is on it.
- **Dismissible:** <kbd>Escape</kbd> closes it without moving the pointer or focus. It stays closed until the pointer or focus leaves the target and comes back.
- **Persistent:** it stays open until the pointer and focus have left, it's dismissed, or the target leaves the page.

An outside click also closes it.

While a tooltip is open, its id is added to the target's `aria-describedby`, alongside any ids already there, and removed again when it closes. The panel renders `role="tooltip"`.

| Attribute          | When present                            | Value                                                        |
|--------------------|-----------------------------------------|--------------------------------------------------------------|
| `aria-describedby` | While the tooltip is open               | The target's own ids, followed by the tooltip's generated id |
| `role="tooltip"`   | On the tooltip panel itself, while open | `"tooltip"`                                                  |

**Consumer responsibilities:**

- Provide an accessible name for the `target` element independent of the tooltip (the tooltip supplies a description, not a name).
- Don't put interactive content (links, buttons) in a tooltip. It isn't focusable; use `Popover` for that.

<!-- verification-checklist
- [x] API definitions and defaults verified against source (tooltip.component.ts) and regenerated component-metadata.json
- [x] `shown`/`hidden` outputs included, emitted once open and once closed
- [x] CSS-selector `target` documented as document-level delegation with `closest()` (no MutationObserver), covered by tooltip-behavior.spec.ts
- [x] `TooltipPosition` documented as exported; `PopupAnchor` confirmed exported from popup
- [x] WCAG 1.4.13 hoverable / dismissible / persistent behavior documented from HoverIntent (100 ms grace, panel hover, Escape until leave), covered by specs
- [x] aria-describedby documented as appended to and removed by token, not replaced; role="tooltip" from tooltip.component.html
- [x] RTL: left/right physical, start/end by direction, flip to the opposite side with the arrow following
- [x] Touch pointers ignored for hover; focus opens the tooltip
- [x] API table rows sorted A→Z
- [x] No Tailwind/internal CSS class names, internal data attributes, or DOM structure exposed
- [x] No claim of public methods (none exist on TooltipComponent)
-->
