## Overview

Apply `monaTooltip` to any host element that carries a native `title` attribute, or give it the tooltip's content directly: `monaTooltip="Save changes"`, or `[monaTooltip]="template"` for rich content.

The directive moves each `title` it uses to a `data-mona-title` attribute, so the browser's own tooltip never appears alongside the styled one. The title stays there for as long as the directive exists, and is put back when it is destroyed. An element named only by its title, such as an icon-only button, keeps that name through `aria-label`.

Use `TooltipDirective` when you want a styled, positioned tooltip without adding markup. Use `TooltipComponent` when one tooltip's content should live in its own element, or apply to every element matching a selector across the page.

## Import & Basic Usage

```typescript
import { TooltipDirective } from "@nanahoshi/mona-ui/tooltip";
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

Elements matching `filter` that are added to or removed from the container after initial render are picked up automatically: one listener on the container handles them all.

## Public Customization

- **`position`** — `"top"` (default), `"bottom"`, `"left"`, `"right"`, `"start"`, or `"end"`. The side of the target the tooltip opens on. `left` and `right` are physical sides in both directions; `start` and `end` follow the text direction (in RTL, `start` is the right). When there isn't room, the tooltip flips to the opposite side, and its arrow follows.
- **`rounded`** (aliased as `tooltipRounded`) — `'none'`, `'small'`, `'medium'` (default), `'large'`, or `'full'`. Controls the tooltip panel's border radius.
- **`showDelay`** / **`hideDelay`** — milliseconds to wait before showing the tooltip, or before hiding it once the pointer or focus has left. Both default to `0`. A pointer that leaves always gets a grace of about 100 ms, so it can move onto the tooltip.
- **`monaTooltip`** — in `host` mode, the tooltip's content: text, or a `TemplateRef`. Without it, the host's `title` is shown. In `content` mode, each element's `title` is shown.

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

**Template content:**

```html
<button monaButton [monaTooltip]="shortcut" aria-label="Save">
    <svg aria-hidden="true"><!-- save icon --></svg>
</button>
<ng-template #shortcut>Save <kbd>Ctrl</kbd>+<kbd>S</kbd></ng-template>
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

The tooltip opens when the pointer moves onto the anchor or keyboard focus enters it, and closes when both have left. Touch pointers don't open it, since a tap would show it and hide it again at once.

It meets WCAG 1.4.13 (content on hover or focus):

- **Hoverable:** the pointer can move from the anchor onto the tooltip, and the tooltip stays open while the pointer is on it.
- **Dismissible:** <kbd>Escape</kbd> closes it without moving the pointer or focus, and without bringing the browser's own `title` tooltip back. It stays closed until the pointer or focus leaves the anchor and comes back.
- **Persistent:** it stays open until the pointer and focus have left, it's dismissed, or the anchor leaves the page.

An outside click also closes it.

While a tooltip is open, its id is added to the anchor's `aria-describedby`, alongside any ids already there, and removed again when it closes. The panel renders `role="tooltip"`.

| Attribute          | When present                                              | Value                                                          |
|--------------------|-----------------------------------------------------------|----------------------------------------------------------------|
| `aria-describedby` | While the tooltip is open                                 | The anchor's own ids, followed by the tooltip's generated id   |
| `aria-label`       | On an anchor with no other name, once its title has moved | The title                                                      |
| `data-mona-title`  | On each element whose title the directive has used        | The title, moved from `title` until the directive is destroyed |
| `role="tooltip"`   | On the tooltip panel itself, while open                   | `"tooltip"`                                                    |

**Consumer responsibilities:**

- Provide an accessible name for the anchor element independent of the tooltip. A title-only name is kept through `aria-label`, but visible text or your own `aria-label` is better.
- Read titles from `data-mona-title`, not `title`, in code or tests that run while the directive is attached.
- Don't put interactive content in a tooltip. It isn't focusable; use `Popover` for that.

## API

### `TooltipDirective`

**Selector:** `[monaTooltip]`

#### Inputs

| Name          | Type                                                  | Default     | Description                                                                                                                                                   |
|---------------|-------------------------------------------------------|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `disabled`    | `boolean`                                             | `false`     | Whether the tooltip is disabled. When disabled, the tooltip isn't shown, and an open one closes.                                                              |
| `filter`      | `string`                                              | `'[title]'` | CSS selector matching descendant elements that receive tooltips. Only applies when `mode` is `'content'`.                                                     |
| `hideDelay`   | `number`                                              | `0`         | Delay in milliseconds before hiding the tooltip after the pointer or focus leaves. A leaving pointer always gets a grace of about 100 ms.                     |
| `mode`        | `'host' \| 'content'`                                 | `'host'`    | `'host'` shows `monaTooltip`, or the host element's own `title`. `'content'` shows the `title` of descendant elements matching `filter`.                      |
| `monaTooltip` | `string \| TemplateRef<unknown> \| null \| undefined` | `''`        | The tooltip's content in `host` mode: text, or a template. Without it, the host's `title` is shown.                                                           |
| `position`    | `TooltipPosition`                                     | `'top'`     | Side of the anchor the tooltip opens on: `"top"`, `"bottom"`, `"left"`, `"right"`, `"start"` or `"end"`. It flips to the opposite side when there isn't room. |
| `rounded`     | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'`  | `'medium'`  | Border-radius preset applied to the tooltip panel. Bound via the `tooltipRounded` alias.                                                                      |
| `showDelay`   | `number`                                              | `0`         | Delay in milliseconds before showing the tooltip after the trigger event.                                                                                     |

`TooltipPosition` (`"top" | "bottom" | "left" | "right" | "start" | "end"`) is exported alongside `TooltipComponent`.

#### Outputs

| Name     | Type   | Description                          |
|----------|--------|--------------------------------------|
| `hidden` | `void` | Emitted once the tooltip has closed. |
| `shown`  | `void` | Emitted once the tooltip has opened. |

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source (tooltip.directive.ts) and regenerated component-metadata.json
- [x] `rounded` documented with its `tooltipRounded` alias; new `monaTooltip` content input (string or TemplateRef) documented
- [x] `shown`/`hidden` outputs included, emitted once open and once closed
- [x] Content mode documented as delegation from the host with `closest()`, covered by tooltip-behavior.spec.ts (re-rendered and added items)
- [x] `title` → `data-mona-title` for the directive's lifetime, restored on destroy; `aria-label` kept for title-only names (spec-covered)
- [x] WCAG 1.4.13 hoverable / dismissible / persistent behavior documented from HoverIntent, covered by specs
- [x] aria-describedby documented as appended to and removed by token, not replaced
- [x] RTL: left/right physical, start/end by direction, flip to the opposite side with the arrow following
- [x] API table rows sorted A→Z
- [x] `data-mona-title` documented on purpose, since consumers can observe it; no Tailwind/internal CSS class names exposed
-->
