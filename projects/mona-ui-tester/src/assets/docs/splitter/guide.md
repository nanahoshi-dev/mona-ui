## Overview

`SplitterComponent` (`mona-splitter`) renders its projected `SplitterPaneComponent` (`mona-splitter-pane`) children side by side, separated by a draggable resizer bar. The `orientation` input switches the layout between a horizontal row and a vertical column.

Each pane controls its own sizing through `size`, `min`, and `max`, and can opt in to drag-resizing (`resizable`) and collapse/expand (`collapsible`) independently of its siblings. The splitter fills the width and height of its containing element, so give the host element (or an ancestor) an explicit height for predictable layout.

**Use `SplitterComponent` when you need to:**

- Let users adjust the relative width or height of adjacent content regions (e.g. a sidebar and a main panel)
- Provide a panel users can collapse to reclaim space, with controls to bring it back

## Import & Basic Usage

```typescript
import { SplitterComponent, SplitterPaneComponent } from "@nanahoshi/mona-ui/splitter";
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

## Examples

### Vertical

```example
splitter/vertical
```

### Collapsible pane

`collapsed` and `size` are two-way models, so the page can read and change both.

```example
splitter/collapsible
```

### Proportional sizing

A fixed pane next to two `fr` panes, which share the remaining space at a 1:2 ratio.

```example
splitter/proportional
```

### Saving a layout

`resizeEnd` gives every pane's `size` in order, ready to pass back in.

```example
splitter/save-layout
```

## Pane Sizing

Each `mona-splitter-pane`'s `size` accepts:

- A number or pixel string (e.g. `240`, `"240px"`) — a fixed size
- Another CSS length string (e.g. `"20%"`, `"10rem"`) — a fixed size in that unit
- A proportional string in the form `"<n>fr"` (e.g. `"1fr"`, `"2fr"`) — shares remaining space with other `fr` panes by weight, similar to a CSS grid `fr` track
- An empty string (the default) — the pane absorbs the splitter's remaining space

If no pane is left with an empty `size`, the last non-collapsed pane absorbs remaining space instead — unless that pane already has an `fr` size, which is honored as its weight rather than being overridden.

`min` and `max` take numbers and pixels only, such as `120` or `"120px"`, because a drag works in pixels. Anything else, such as a percentage, `fr` or `rem`, is ignored, with a warning in development. They hold for the layout as well as for a drag, so a first size or a window resize can't take a pane past them. A collapsed pane doesn't keep its `min`, since it has to be able to close.

### When the layout is reported

`sizeChange` fires on every move of a drag. `resizeEnd` on `mona-splitter` fires once when a drag ends, after each key that resizes, and when the separator collapses or expands a pane, with every pane's `size` in order, ready to pass back in, as in the [Saving a layout](#saving-a-layout) example.

A press that moved nothing doesn't fire it. Neither does collapsing or expanding with a double-click, a collapse button, `Enter` or `Alt` + arrow, so bind `collapsed` too if the layout should remember that.

## Resizing & Collapsing

Dragging the bar between two panes resizes both of them, clamped to their `min`/`max`, with the primary button or by touch. A pane's `resizable` input is `true` by default. Setting it to `false` stops both bars beside that pane from moving, by pointer or key. The bar still renders.

The bar is 2 pixels wide, and its hit area reaches past it, over the edges of the panes: 12 pixels, or 24 on a coarse pointer such as a finger. The collapse buttons are 24 pixels. Pressing the bar gives it focus, without showing the focus outline, so the keys work straight after a drag.

A pane's `collapsible` input is `false` by default. When `true`, the pane can be collapsed and expanded by:

- Double-clicking the adjacent resizer bar
- Collapse buttons that appear when the bar is hovered or has focus, which also covers touch, since a tap focuses it (rendered only while the relevant neighbor is collapsible and not already collapsed)
- Keyboard — see Accessibility Notes below

A collapsed pane's content is hidden, can't take focus, and its size is reduced to zero. Expanding it restores its previous size where space allows.

## Appearance & Styling

### Orientation

| `orientation`          | Layout                                                    |
|------------------------|-----------------------------------------------------------|
| `horizontal` (default) | Panes arranged in a row, draggable bars are vertical      |
| `vertical`             | Panes arranged in a column, draggable bars are horizontal |

### Custom classes

`SplitterComponent` and `SplitterPaneComponent` have no dedicated `class` input. Apply a `class` attribute directly to `<mona-splitter>` or `<mona-splitter-pane>`; Angular merges it with the component's own classes. Unlike most other Mona UI components, this merge does not go through `tailwind-merge`, so conflicting Tailwind utility classes are not deduplicated.

## Accessibility Notes

The bar between two panes contains an element with `role="separator"`, with these managed attributes. The collapse buttons sit beside it, not inside it, so they stay reachable.

| Attribute          | When present                                                                  | Value                                                                  |
|--------------------|-------------------------------------------------------------------------------|------------------------------------------------------------------------|
| `aria-label`       | Always                                                                        | The `label` of the pane before the bar, or a generic name              |
| `aria-orientation` | Always                                                                        | The way the bar runs: `"vertical"` in a horizontal splitter, and the reverse |
| `aria-controls`    | When the bar can do something                                                 | The `id` of the pane before the bar                                    |
| `aria-valuenow`    | When the bar can do something                                                 | Current size, in pixels, of the pane before the bar. Follows the container's size. |
| `aria-valuemin`    | When the bar can do something                                                 | Minimum size, in pixels, the pane before the bar can shrink to         |
| `aria-valuemax`    | When the bar can do something                                                 | Maximum size, in pixels, the pane before the bar can currently grow to |
| `tabindex`         | When the bar can do something                                                 | `"0"`. A bar that can't move or collapse anything is a plain separator, out of the tab order. |
| `aria-hidden`      | On a pane's content wrapper, while that pane is `collapsible` and `collapsed` | `"true"`                                                               |
| `inert`            | On a pane's content wrapper, while that pane is `collapsible` and `collapsed` | Present                                                                |

Give each pane a `label` when a splitter has more than one bar, or a screen reader can't tell them apart.

Each collapse button has an `aria-label` describing its action (e.g. "Collapse previous pane" / "Collapse next pane" for horizontal splitters, "Collapse pane above" / "Collapse pane below" for vertical splitters).

**Keyboard map** (when a resizer bar has focus):

| Key                                                                           | Action                                                                                                                                  |
|-------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| `ArrowLeft` / `ArrowRight` (horizontal) or `ArrowUp` / `ArrowDown` (vertical) | Resize the adjacent panes by `keyboardStep`, 10 pixels by default, if both are resizable. On a collapsed pane, a key pointing out of it brings it back at its previous size, and one pointing into it does nothing. |
| `Home` / `End`                                                                | Move the bar as far as the limits allow, with the pane before it at its smallest or largest.                                           |
| `Alt` + arrow key (same mapping as above)                                     | Collapse the adjacent collapsible pane in that direction. If that pane isn't collapsible, the key stays the browser's. With a collapsed pane beside the bar, either direction expands it. |
| `Enter`                                                                       | Toggle collapse/expand of the nearest collapsible pane, preferring a pane that is already collapsed.                                    |

In a right-to-left layout, `ArrowLeft` and `ArrowRight` swap, so they still move the bar the way they point.

`Tab` follows the page's order: from a bar to its collapse buttons, then into the next pane's content, then to the next bar. There's no `F6` shortcut between panes.

<!-- verification-checklist
- [x] API definitions and defaults verified against source (splitter.component.ts, splitter-pane.component.ts) and component-metadata.json
- [x] Pane sizing rules (fr weighting, auto-sized pane fallback, px-only min/max) verified against SplitterPaneStyleDirective and a regression test (splitter-pane-style.directive.spec.ts)
- [x] "fr" proportional sizing fixed in source: getFractionalWeight's regex had `\\.` instead of `\.` (never matched); the auto-sized-pane fallback also clobbered an explicit fr weight on the last pane until getPaneFlexGrow's check order was fixed
- [x] ARIA table verified against splitter-resizer.component.html (role, aria-label, aria-orientation, aria-controls, aria-valuenow/min/max, tabindex)
- [x] Collapse button aria-label text verified against splitter-resizer-handle.component.html
- [x] Keyboard map verified against SplitterResizerComponent handleKeydown/handleResizerKeys/handleCollapserKeys/resizeFromKey
- [x] No internal or unexported APIs exposed (getPaneByUid omitted; it is marked @internal in source)
- [x] No "class" input claimed; absence of tailwind-merge on host class verified against source
-->
