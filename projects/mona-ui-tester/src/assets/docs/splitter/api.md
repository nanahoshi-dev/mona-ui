## Overview

`SplitterComponent` (`mona-splitter`) renders its projected `SplitterPaneComponent` (`mona-splitter-pane`) children side by side, separated by a draggable resizer bar. The `orientation` input switches the layout between a horizontal row and a vertical column.

Each pane controls its own sizing through `size`, `min`, and `max`, and can opt in to drag-resizing (`resizable`) and collapse/expand (`collapsible`) independently of its siblings. The splitter fills the width and height of its containing element, so give the host element (or an ancestor) an explicit height for predictable layout.

**Use `SplitterComponent` when you need to:**

- Let users adjust the relative width or height of adjacent content regions (e.g. a sidebar and a main panel)
- Provide a panel users can collapse to reclaim space, with controls to bring it back

## Import & Basic Usage

```typescript
import { SplitterComponent, SplitterPaneComponent } from "@mirei/mona-ui";
```

Add both to your standalone component's `imports` array.

```html
<mona-splitter class="h-64 w-full">
    <mona-splitter-pane [size]="240" [min]="120" [max]="400">
        <div class="p-4">Sidebar</div>
    </mona-splitter-pane>
    <mona-splitter-pane>
        <div class="p-4">Main content</div>
    </mona-splitter-pane>
</mona-splitter>
```

The second pane has no `size`, so it absorbs the remaining space.

**Vertical orientation:**

```html
<mona-splitter orientation="vertical" class="h-96 w-full">
    <mona-splitter-pane [size]="120">
        <div class="p-4">Top</div>
    </mona-splitter-pane>
    <mona-splitter-pane>
        <div class="p-4">Bottom</div>
    </mona-splitter-pane>
</mona-splitter>
```

**Collapsible pane with two-way state:**

```html
<mona-splitter class="h-64 w-full">
    <mona-splitter-pane [collapsible]="true" [(collapsed)]="sidebarCollapsed" [(size)]="sidebarSize" [min]="80" [max]="320">
        <div class="p-4">Sidebar</div>
    </mona-splitter-pane>
    <mona-splitter-pane>
        <div class="p-4">Main content</div>
    </mona-splitter-pane>
</mona-splitter>
```

**Proportional ("fr") sizing** — mix a fixed pane with two flexible panes sharing the remaining space at a 1:2 ratio:

```html
<mona-splitter class="h-64 w-full">
    <mona-splitter-pane [size]="200">
        <div class="p-4">Fixed</div>
    </mona-splitter-pane>
    <mona-splitter-pane size="1fr">
        <div class="p-4">Flexible (1x)</div>
    </mona-splitter-pane>
    <mona-splitter-pane size="2fr">
        <div class="p-4">Flexible (2x)</div>
    </mona-splitter-pane>
</mona-splitter>
```

## Pane Sizing

Each `mona-splitter-pane`'s `size` accepts:

- A number or pixel string (e.g. `240`, `"240px"`) — a fixed size
- Another CSS length string (e.g. `"20%"`, `"10rem"`) — a fixed size in that unit
- A proportional string in the form `"<n>fr"` (e.g. `"1fr"`, `"2fr"`) — shares remaining space with other `fr` panes by weight, similar to a CSS grid `fr` track
- An empty string (the default) — the pane absorbs the splitter's remaining space

If no pane is left with an empty `size`, the last non-collapsed pane absorbs remaining space instead — unless that pane already has an `fr` size, which is honored as its weight rather than being overridden.

`min` and `max` are evaluated in pixels. They accept a number or a pixel-suffixed string (e.g. `"120px"`); percentage and `fr` values are not supported for `min`/`max`.

## Resizing & Collapsing

Dragging the bar between two panes resizes both of them, clamped to their `min`/`max`. A pane's `resizable` input is `true` by default; setting it to `false` disables dragging on both resizer bars adjacent to that pane (the divider still renders, dragging is ignored).

A pane's `collapsible` input is `false` by default. When `true`, the pane can be collapsed and expanded by:

- Double-clicking the adjacent resizer bar
- Collapse buttons that appear when hovering the resizer bar (rendered only while the relevant neighbor is collapsible and not already collapsed)
- Keyboard — see Accessibility Notes below

A collapsed pane's content is hidden and its size reduced to zero; expanding it restores its previous size where space allows.

## Appearance & Styling

### Orientation

| `orientation` | Layout |
|---|---|
| `horizontal` (default) | Panes arranged in a row, draggable bars are vertical |
| `vertical` | Panes arranged in a column, draggable bars are horizontal |

### Custom classes

`SplitterComponent` and `SplitterPaneComponent` have no dedicated `class` input. Apply a `class` attribute directly to `<mona-splitter>` or `<mona-splitter-pane>`; Angular merges it with the component's own classes. Unlike most other Mona UI components, this merge does not go through `tailwind-merge`, so conflicting Tailwind utility classes are not deduplicated.

## Accessibility Notes

The resizer bar between two panes renders `role="separator"` with the following managed attributes:

| Attribute | When present | Value |
|---|---|---|
| `role` | Always | `"separator"` |
| `aria-orientation` | Always | Matches the splitter's `orientation` |
| `aria-valuenow` | Always | Current size, in pixels, of the pane before the bar |
| `aria-valuemin` | Always | Minimum size, in pixels, the pane before the bar can shrink to |
| `aria-valuemax` | Always | Maximum size, in pixels, the pane before the bar can currently grow to |
| `tabindex` | Always | `"0"`, or `"-1"` when the bar cannot be dragged (either adjacent pane has `resizable` set to `false`) and neither adjacent pane is `collapsible` |
| `aria-hidden` | On a pane's content wrapper, while that pane is `collapsible` and `collapsed` | `"true"` |

Each collapse button rendered on hover has an `aria-label` describing its action (e.g. "Collapse previous pane" / "Collapse next pane" for horizontal splitters, "Collapse pane above" / "Collapse pane below" for vertical splitters).

**Keyboard map** (when a resizer bar has focus):

| Key | Action |
|---|---|
| `ArrowLeft` / `ArrowRight` (horizontal) or `ArrowUp` / `ArrowDown` (vertical) | Resize the adjacent panes by a fixed step. Works as long as at least one of the two adjacent panes is resizable. |
| `Alt` + arrow key (same mapping as above) | Collapse the adjacent collapsible pane in that direction. No-op if that pane is not collapsible. |
| `Enter` | Toggle collapse/expand of the nearest collapsible pane, preferring a pane that is already collapsed. |
| `Tab` / `Shift+Tab` | Move focus to the next/previous resizer bar within the same splitter instead of the browser's default focus order. |

Because `Tab` jumps directly between resizer bars, focusable elements projected inside a pane that sits between two resizer bars may not be reachable by tabbing through the splitter — tab into that pane's content before reaching its surrounding resizer bars.

No additional ARIA wiring is required from the consumer for the splitter or its resizers. Provide accessible content within each pane as you would for any other layout container.

## API

### `SplitterComponent`

**Selector:** `mona-splitter`

#### Inputs

| Name | Type | Default | Description |
|---|---|---|---|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | The layout direction of the splitter panes. |

`SplitterComponent` has no outputs.

### `SplitterPaneComponent`

**Selector:** `mona-splitter-pane`

#### Inputs

| Name | Type | Default | Description |
|---|---|---|---|
| `collapsed` | `boolean` | `false` | Two-way bindable collapsed state. When `true`, the pane's content is hidden and its size reduced to zero. |
| `collapsible` | `boolean` | `false` | Allows the pane to be collapsed and expanded via the adjacent resizer bar's double-click, hover controls, or keyboard. |
| `max` | `string \| number \| null` | `null` | Maximum size, in pixels, the pane can grow to. Accepts a number or a pixel-suffixed string (e.g. `"400px"`); percentage and `fr` values are not supported. |
| `min` | `string \| number \| null` | `null` | Minimum size, in pixels, the pane can shrink to. Accepts a number or a pixel-suffixed string (e.g. `"120px"`); percentage and `fr` values are not supported. |
| `resizable` | `boolean` | `true` | Allows the pane to be resized by dragging the resizer bar(s) adjacent to it. Setting this to `false` disables dragging on both adjacent bars. |
| `size` | `string \| number` | `''` | Two-way bindable pane size. Accepts a pixel number, a CSS length string (e.g. `"240px"`, `"20%"`), or a proportional `"<n>fr"` string. Left empty, the pane absorbs the splitter's remaining space; see Pane Sizing above. |

`SplitterPaneComponent` has no outputs. Observe `[(size)]` and `[(collapsed)]` to react to changes.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source (splitter.component.ts, splitter-pane.component.ts) and component-metadata.json
- [x] Pane sizing rules (fr weighting, auto-sized pane fallback, px-only min/max) verified against SplitterPaneStyleDirective and a regression test (splitter-pane-style.directive.spec.ts)
- [x] "fr" proportional sizing fixed in source: getFractionalWeight's regex had `\\.` instead of `\.` (never matched); the auto-sized-pane fallback also clobbered an explicit fr weight on the last pane until getPaneFlexGrow's check order was fixed
- [x] ARIA table verified against SplitterResizerComponent host bindings (role, aria-orientation, aria-valuenow/min/max, tabindex)
- [x] Collapse button aria-label text verified against splitter-resizer-handle.component.html
- [x] Keyboard map verified against SplitterResizerComponent handleKeydown/handleResizerKeys/handleCollapserKeys/focusAdjacentResizer
- [x] No internal or unexported APIs exposed (getPaneByUid omitted; it is marked @internal in source)
- [x] No "class" input claimed; absence of tailwind-merge on host class verified against source
-->
