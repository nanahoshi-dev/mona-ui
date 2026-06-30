## Overview

Apply `monaTooltip` to any host element that already carries a native `title` attribute. The directive removes the native `title` attribute while the tooltip is shown — so the browser's default tooltip never appears alongside it — and restores it once the tooltip closes.

Use `TooltipDirective` when you want a styled, positioned tooltip driven entirely by `title` attributes, without adding markup. For tooltip content that needs more than plain text (icons, formatting, multiple lines of structured markup), use `TooltipComponent` instead.

## Import & Basic Usage

```typescript
import { TooltipDirective } from "@mirei/mona-ui";
```

**Basic usage — `host` mode:**

By default the directive reads the `title` attribute of the element it is applied to:

```html
<button monaTooltip title="Save changes">Save</button>
```

**`content` mode — tooltips for descendant elements:**

Set `mode="content"` to apply the directive once to a container and have it manage tooltips for descendant elements that match `filter` (default `[title]`):

```html
<div monaTooltip mode="content" filter="[title]">
    <button title="Save changes">Save</button>
    <button title="Discard changes">Discard</button>
</div>
```

Elements matching `filter` that are added to or removed from the container after initial render are picked up automatically.

## Public Customization

- **`position`** — `"top"` (default), `"right"`, `"bottom"`, or `"left"`. Controls which side of the target element the tooltip and its arrow are anchored to.
- **`rounded`** (aliased as `tooltipRounded`) — `'none'`, `'small'`, `'medium'` (default), `'large'`, or `'full'`. Controls the tooltip panel's border radius.
- **`showDelay`** / **`hideDelay`** — milliseconds to wait before showing or hiding the tooltip after the trigger event. Both default to `0`.

The tooltip panel's content is plain text only, taken directly from the `title` attribute. Rich or templated tooltip content is not supported by this directive.

## Examples

**Custom position:**

```html
<button monaButton monaTooltip title="More info" position="right">Info</button>
```

**Show/hide delay:**

```html
<button monaButton monaTooltip title="Delete this item" [showDelay]="300" [hideDelay]="150">
    Delete
</button>
```

**Disabling the tooltip conditionally:**

```html
<button monaButton monaTooltip title="Submit the form" [disabled]="formPending()">
    Submit
</button>
```

**Reacting to visibility changes:**

```html
<button monaButton monaTooltip title="Export data" (shown)="onTooltipShown()" (hidden)="onTooltipHidden()">
    Export
</button>
```

**Content mode with a custom filter:**

```html
<div monaTooltip mode="content" filter="button[title]">
    @for (action of actions(); track action.id) {
        <button monaButton [title]="action.label">{{ action.icon }}</button>
    }
</div>
```

## Accessibility Notes

While a tooltip is open, the directive sets `aria-describedby` on the anchor element, pointing at the tooltip panel, which renders `role="tooltip"`. Both are removed when the tooltip closes.

The tooltip text comes from the anchor's own `title` attribute, so no separate accessible-description wiring is required. The anchor still needs its own accessible name (native label text, `aria-label`, or equivalent) independent of the tooltip.

An open tooltip closes on <kbd>Escape</kbd> and on an outside click, in addition to `pointerleave` / `focusout` on the anchor.

**Known limitation:** with the default `hideDelay` of `0`, the tooltip closes as soon as the pointer leaves the anchor. There is currently no way to move the pointer onto the tooltip panel itself before it closes.

| Attribute         | When present                  | Value                                  |
|--------------------|-------------------------------|-----------------------------------------|
| `aria-describedby` | While the tooltip is open     | The tooltip panel's generated id        |
| `role="tooltip"`   | On the tooltip panel itself, while open | `"tooltip"`                   |

**Consumer responsibilities:**

- Provide an accessible name for the anchor element independent of the tooltip (the tooltip supplies a description, not a name).

## API

### `TooltipDirective`

**Selector:** `[monaTooltip]`

#### Inputs

| Name | Type | Default | Description |
|---|---|---|---|
| `disabled` | `boolean` | `false` | Whether the tooltip is disabled. When disabled, the tooltip will not be shown. |
| `filter` | `string` | `'[title]'` | CSS selector matching descendant elements that receive tooltips. Only applies when `mode` is `'content'`. |
| `hideDelay` | `number` | `0` | Delay in milliseconds before hiding the tooltip. |
| `mode` | `'host' \| 'content'` | `'host'` | `'host'` reads the tooltip text from the host element's own `title` attribute. `'content'` reads it from descendant elements matching `filter`. |
| `position` | `"top" \| "right" \| "bottom" \| "left"`¹ | `'top'` | Side of the target element the tooltip is anchored to. |
| `rounded` | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` | Border-radius preset applied to the tooltip panel. Bound via the `tooltipRounded` alias. |
| `showDelay` | `number` | `0` | Delay in milliseconds before showing the tooltip after the trigger event. |

¹ Exposed publicly via the `Position` type, which is referenced by this input but not exported from `@mirei/mona-ui`. <!-- TODO(owner-review): confirm whether Position should be exported. -->

#### Outputs

| Name | Type | Description |
|---|---|---|
| `hidden` | `void` | Emitted when the tooltip popup is hidden. |
| `shown` | `void` | Emitted when the tooltip popup is shown. |

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source (tooltip.directive.ts) and regenerated component-metadata.json
- [x] `rounded` documented with its `tooltipRounded` alias
- [x] `shown`/`hidden` outputs included (confirmed present in source and metadata after regeneration)
- [x] Content-mode dynamic descendant tracking documented (confirmed via MutationObserver-backed re-subscription in source and a dedicated spec test)
- [x] No internal or unexported APIs exposed; `Position` type usage flagged as TODO(owner-review) instead of presented as exported
- [x] aria-describedby / role="tooltip" documented from source (#createTooltip, TooltipTemplateComponent template); accessible-name consumer responsibility stated explicitly
- [x] Escape / outside-click close behavior documented (closeOnEscape: true, closeOnOutsideClick: true in #createTooltip)
- [x] Known hover-dismiss limitation documented (hideDelay default 0; no pointer bridge onto the tooltip panel) instead of presented as an accessibility guarantee
- [x] No claim of rich/templated tooltip content; plain-text-only limitation stated, with TooltipComponent referenced as the alternative
- [x] API table rows sorted A→Z
- [x] No Tailwind/internal CSS class names, internal data attributes, or DOM structure exposed
-->
