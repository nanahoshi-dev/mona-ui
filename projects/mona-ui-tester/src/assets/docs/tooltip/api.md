## Overview

`TooltipComponent` is placed anywhere in a template and points at a separate `target` element. Unlike `TooltipDirective`, its content comes from projected content, not a `title` attribute, so it supports icons, formatting, and multiple lines.

Use `TooltipComponent` when the tooltip needs more than plain text. Use `TooltipDirective` (`monaTooltip`) when a `title` attribute is enough and you want to avoid adding a separate element.

## Import & Basic Usage

```typescript
import { TooltipComponent } from "@mirei/mona-ui";
```

**Targeting an element reference:**

```html
<button #saveButton>Save</button>
<mona-tooltip [target]="saveButton">Save your current changes</mona-tooltip>
```

**Targeting a CSS selector:**

A selector target attaches the same tooltip behavior to every matching element, including ones added after initial render:

```html
<div class="flex gap-2">
    <button class="action" data-action="save">Save</button>
    <button class="action" data-action="discard">Discard</button>
</div>
<mona-tooltip target=".action">Action button</mona-tooltip>
```

## Public Customization

- **`position`** — `"top"` (default), `"right"`, `"bottom"`, or `"left"`. Controls which side of the target the tooltip and its arrow are anchored to.
- **`rounded`** — `'none'`, `'small'`, `'medium'` (default), `'large'`, or `'full'`. Controls the tooltip panel's border radius.
- **`showDelay`** / **`hideDelay`** — milliseconds to wait before showing or hiding the tooltip after the trigger event. Both default to `0`.
- **Projected content** — anything placed between the `<mona-tooltip>` tags is rendered inside the tooltip panel, including markup and other components.

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

While a tooltip is open, the component sets `aria-describedby` on the `target` element, pointing at the tooltip panel, which renders `role="tooltip"`. Both are removed when the tooltip closes.

The `target` element still needs its own accessible name (native label text, `aria-label`, or equivalent), independent of the tooltip's description.

An open tooltip closes on <kbd>Escape</kbd> and on an outside click, in addition to `pointerleave` / `focusout` on the target.

**Known limitation:** with the default `hideDelay` of `0`, the tooltip closes as soon as the pointer leaves the target. There is currently no way to move the pointer onto the tooltip panel itself before it closes.

| Attribute         | When present                             | Value                             |
|--------------------|-------------------------------------------|-------------------------------------|
| `aria-describedby` | While the tooltip is open                 | The tooltip panel's generated id    |
| `role="tooltip"`   | On the tooltip panel itself, while open   | `"tooltip"`                         |

**Consumer responsibilities:**

- Provide an accessible name for the `target` element independent of the tooltip (the tooltip supplies a description, not a name).

## API

### `TooltipComponent`

**Selector:** `mona-tooltip`

#### Inputs

| Name | Type | Default | Description |
|---|---|---|---|
| `disabled` | `boolean` | `false` | Whether the tooltip is disabled. When disabled, the tooltip will not be shown. |
| `hideDelay` | `number` | `0` | Delay in milliseconds before hiding the tooltip after the trigger event ends. |
| `position` | `"top" \| "right" \| "bottom" \| "left"`¹ | `'top'` | Side of the target element the tooltip is anchored to. |
| `rounded` | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` | Border-radius preset applied to the tooltip panel. |
| `showDelay` | `number` | `0` | Delay in milliseconds before showing the tooltip after the trigger event. |
| `target` | `Element \| ElementRef<HTMLElement> \| string`² | — | Required. The target element(s) the tooltip is attached to: a direct element/`ElementRef`, or a CSS selector string matching one or more elements. |

¹ Exposed publicly via the `Position` type, which is referenced by this input but not exported from `@mirei/mona-ui`. <!-- TODO(owner-review): confirm whether Position should be exported. -->

² Exposed publicly via the `PopupAnchor` type, which is referenced by this input but not exported from `@mirei/mona-ui`. <!-- TODO(owner-review): confirm whether PopupAnchor should be exported. -->

#### Outputs

| Name | Type | Description |
|---|---|---|
| `hidden` | `void` | Emitted when the tooltip popup is hidden. |
| `shown` | `void` | Emitted when the tooltip popup is shown. |

`TooltipComponent` has no public methods.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source (tooltip.component.ts) and regenerated component-metadata.json
- [x] `shown`/`hidden` outputs included (confirmed present in source and metadata after regeneration)
- [x] CSS-selector `target` dynamic descendant tracking documented (confirmed via MutationObserver-backed re-subscription in source and a dedicated spec test)
- [x] No internal or unexported APIs exposed; `Position` and `PopupAnchor` type usage flagged as TODO(owner-review) instead of presented as exported
- [x] aria-describedby / role="tooltip" documented from source (#createTooltip, tooltip.component.html); accessible-name consumer responsibility stated explicitly
- [x] Escape / outside-click close behavior documented (closeOnEscape: true, closeOnOutsideClick: true in #createTooltip)
- [x] Known hover-dismiss limitation documented (hideDelay default 0; closeOnMouseLeave: false; no pointer bridge onto the tooltip panel) instead of presented as an accessibility guarantee
- [x] Projected content documented as the supported way to provide rich tooltip content, with TooltipDirective referenced as the plain-text alternative
- [x] API table rows sorted A→Z
- [x] No Tailwind/internal CSS class names, internal data attributes, or DOM structure exposed
- [x] No claim of public methods (none exist on TooltipComponent)
-->
