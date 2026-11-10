## Overview

Use a treemap when the data is a tree and the question is how much each part takes of the whole: a budget by department and team, disk usage by folder, revenue by region and country. Every rectangle's area is its value, and a parent's rectangle holds its children's.

**Use something else when:**

- The data is flat, with a handful of parts. A pie or donut reads more easily, see [Pie & Donut](/components/chart-pie).
- The reader must compare values precisely. Areas are hard to compare, and bars are easier, see [Bar & Waterfall](/components/chart-bar).
- The parts are steps that lose volume in order, such as a sign-up flow. Use a funnel, see [Funnel](/components/chart-funnel).
- Values can be negative. A treemap only draws sizes, so a negative value takes no space.

The chart, legend, tooltip and the rest of the shared parts are described on [Chart Overview](/components/chart).

## Import & Quick Start

```typescript
import {
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    TreemapSeriesComponent
} from "@nanahoshi/mona-ui/chart";
```

```html
<mona-chart aria-label="Annual budget" class="h-80 w-full" [data]="budget">
    <mona-treemap-series name="Budget" />
    <mona-chart-legend />
    <mona-chart-tooltip />
</mona-chart>
```

```typescript
protected readonly budget = [
    {
        name: "Engineering",
        children: [
            { name: "Platform", value: 1840 },
            { name: "Mobile", value: 1260 }
        ]
    },
    { name: "Sales", children: [{ name: "Enterprise", value: 1380 }] }
];
```

Give the chart a height. It fills its host, and a host without a height has none.

## Anatomy

The series reads the chart's `data`, unless it has its own `data`, which wins and can also be a single root object. Each item of the array is a top-level node.

| Input | Default | Reads |
| :--- | :--- | :--- |
| `labelField` | `"name"` | The node's label. A node without one is named "Node" followed by a number. |
| `field` | `"value"` | The value of a node without children. |
| `childrenField` | `"children"` | The array of child nodes. |
| `keyField` | none | A stable identity, so a node keeps its id, its hidden state and its animation when the data changes. |
| `colorField` | none | A color for the node and everything below it. |

A field is a property name or an accessor, `(node, index) => value`. Only nodes without children read `field`: a parent's size is always the sum of its children, and a value on a parent is ignored.

Each parent draws a light background with a header strip across the top, which holds its label. The nodes at the bottom of what's drawn, the leaves and any node `maxDepth` collapses, are filled with the branch's color.

### Templates

`ng-template[monaChartTreemapLabelTemplate]`, inside the series, replaces the content of every label, parent headers included. The context is a `ChartTreemapLabelTemplateContext`. `let-node` gives the node's `ChartHierarchyNodeContext`; the context also has the label's `bounds`, its `color` and `textColor`, and the same node fields at the top level.

| Field | Holds |
| :--- | :--- |
| `formattedLabel`, `formattedValue` | The label after `categoryFormatter` and the value after `valueFormatter`. |
| `formattedPath`, `path` | The labels from the top-level node down to this one. |
| `depth` | `1` for a top-level node. |
| `isLeaf`, `isCollapsed` | Whether the node has no children, or has children that `maxDepth` hides. A parent header is neither. |
| `percentageOfParent`, `percentageOfRoot` | The node's share of its parent and of the visible total, from `0` to `1`. |
| `childCount`, `descendantCount`, `aggregateValue` | The size of the subtree and its total. |

The chart, legend and tooltip templates are described on [Chart Overview](/components/chart).

## Examples

### Budget by department

The smallest treemap: an array of departments, each with its teams. `showValues` writes each team's value under its name, and `valueFormatter` formats it there, in the tooltip and in announcements. The legend lists the departments.

```example
chart-treemap/budget
```

### Drill down

`maxDepth` set to `1` collapses each region into one rectangle the size of its total. The chart's `pointClick` event carries the node's `hierarchy`, and its `sourceIndexPath` says which region was chosen, so the page can show that region's countries instead. `Enter` on a focused node emits `pointClick` too, so the drill down works from the keyboard.

```example
chart-treemap/drill-down
```

### Custom labels and colors

`colors` gives each top-level folder its color, and `colorField` paints one node differently from its branch. The label template adds the node's share of its folder, and `minLabelHeight` makes room for the second line.

```example
chart-treemap/custom-labels
```

## Appearance & Styling

| Input | Values | Effect |
| :--- | :--- | :--- |
| `tile` | `"squarify"`, `"binary"`, `"dice"`, `"slice"`, `"slice-dice"` | How a rectangle is split among its children. `squarify` keeps the rectangles close to square, so they're easiest to compare. `binary` splits in balanced halves. `dice` lays children side by side in columns, `slice` stacks them in rows, and `slice-dice` alternates between the two by level. |
| `sort` | `"descending"`, `"ascending"`, `"none"` | The order of siblings. `descending` puts subtrees with more levels first and then the larger values, `ascending` the reverse, and `none` keeps the data's order. |
| `paddingInner` | Pixels, `2` | The gap between siblings. |
| `paddingOuter` | Pixels, `4` | The space inside a parent around its children. |
| `parentHeaderHeight` | Pixels, `20` when unset | The height of a parent's header strip. |
| `colors` | An array of CSS colors | One color per top-level node, used again from the start when there are more nodes than colors. A node's whole branch takes its color. |
| `color` | A CSS color | One color for every branch, when `colors` isn't set. |
| `fillOpacity` | `0` to `1`, `1` when unset | The opacity of the filled rectangles: leaves and collapsed nodes. |
| `parentFillOpacity` | `0` to `1`, `0.15` when unset | The opacity of a parent's background. |
| `strokeColor`, `strokeWidth` | A CSS color, pixels | The outline of each rectangle. By default it's 1 pixel in the surface color, which reads as a gap. |
| `borderRadius` | Pixels, `0` when unset | The corner radius of each rectangle. |

Colors can be any CSS color, or a custom property such as `--color-chart-2`. Without `colors` or `color`, a color set on the series element, with `style` or a `text-` class, colors every branch, and without that the branches take the chart palette in order.

### Labels

| Input | Default | Effect |
| :--- | :--- | :--- |
| `showLabels` | `true` | Labels the leaves and collapsed nodes. |
| `showParentLabels` | `true` | Labels the parents in their header strip. Turned off, parents have no header and are only padded by `paddingOuter`. |
| `showValues` | `false` | Adds the value under each leaf's label. |
| `minLabelWidth` | `30` | The narrowest rectangle that gets a label, in pixels. |
| `minLabelHeight` | `16`, or `24` with `showValues` | The lowest leaf or collapsed node that gets a label. A header needs at least 12 pixels. |
| `maxLabels` | `100` | The most labels shown. Parent headers come first, from the top level down, then the largest leaves. |
| `categoryFormatter` | none | Formats the labels, in the rectangles, the legend, the tooltip and announcements. |
| `valueFormatter` | none | Formats the values. Without it they're shortened, as `1.8K`, for the library locale. |

The text color is chosen to stay readable on each rectangle's fill. Parent headers use the foreground color.

`labelFormatter` is deprecated. Use `categoryFormatter`, which wins when both are set.

## Theming

These custom properties, set on the series element or on the chart, change the defaults. The inputs above take precedence over them.

| Property | Sets |
| :--- | :--- |
| `--mona-chart-treemap-stroke-color` | The outline color. |
| `--mona-chart-treemap-stroke-width` | The outline width, as a number of pixels. |
| `--mona-chart-treemap-fill-opacity` | The opacity of leaves and collapsed nodes. |
| `--mona-chart-treemap-parent-fill-opacity` | The opacity of parent backgrounds. |
| `--mona-chart-treemap-border-radius` | The corner radius, as a number of pixels. |
| `--mona-chart-treemap-label-color` | One text color for every label, instead of the automatic contrast color. |

## Behavior

### One series, no axes

A treemap takes the whole chart on its own. A chart with two treemap series, or a treemap and any other series, draws nothing and logs a development warning. X, Y, angular and radial axes are ignored, with a warning. The chart's `navigation`, `downsampling` and `xField` don't apply.

### Values

- A parent's value is the sum of its descendants, and a parent with an empty `children` array counts as a leaf.
- A negative value counts as `0`, with a development warning. A value that isn't a finite number also counts as `0`. A node worth `0` takes no space.
- When no visible leaf has a positive value, the chart shows its no-data state. So does hiding every top-level node, or the series.
- `children` that isn't an array is ignored with a warning, and a node that contains itself further down is left out, with a warning, so cyclic data doesn't hang the chart. The tree is cut at 128 levels.

### Depth and collapsing

`maxDepth` limits how many levels are laid out. A node at that level that has children is collapsed: it's drawn as one filled rectangle the size of its total, labelled like a leaf, with `isCollapsed` set in the label context and in the event and tooltip `hierarchy`. A value of `0` or less counts as `1`, a fraction is rounded down, and leaving it unset, or setting `Infinity`, shows every level.

### Hiding top-level nodes

The legend has an entry for each top-level node. Toggling one hides that node and everything in it, and the others grow to fill the space. The series then emits `nodeVisibilityChange`, with the node's id, label and new state, and updates `[(hiddenNodeIds)]`. The chart's `seriesVisibilityChange` isn't emitted, since the series stays visible.

- Only top-level ids have an effect. Hiding a deeper node isn't supported.
- Ids are generated: with `keyField` from the key, otherwise from the path of labels. Read them from `nodeVisibilityChange`, or from `hierarchy.nodeId` in the chart's point events, rather than building them by hand.
- Hidden ids the data no longer has are dropped when the data changes, and an empty data set keeps them, as described on [Chart Overview](/components/chart).
- Give nodes a `keyField` when the data reloads or two siblings can share a label. Without one, siblings with the same label are told apart by their order. A key used twice falls back to the path, with a warning.

`[(visible)]` shows or hides the whole series.

### Pointer and tooltip

The pointer picks the deepest node under it. A parent is picked from its header strip, since its children cover the rest, so with `showParentLabels` off a parent can only be reached with the keyboard. The tooltip shows the node's label, its path when it's below the top level, its value and its share of the visible total. `pointClick` and `pointFocusChange` carry the node in `hierarchy`, with the same fields as the label context.

## Accessibility

The chart is the focusable element, and the series adds no roles of its own. Moving to a node announces its path, its value, its share of the total and whether it's a leaf or a group with its number of children.

- **Name the chart and the series.** Give the chart a `title` or `aria-label`, and the series a `name`, which the description reads.
- **Format values.** Use `valueFormatter` to add a unit, since announcements and the data table read the formatted value.
- **Labels are hidden from screen readers.** The labels, including a `monaChartTreemapLabelTemplate`, are `aria-hidden`, so don't put information only there.
- **Don't rely on color alone.** A branch is one color, so keep the parent labels or the legend that name it, and check that custom `colors` keep text readable.
- With `dataTable`, the table has a row for each node, labelled by its path, and a value column.

### Keyboard Navigation

Keys move through the drawn nodes as a tree, in depth-first order.

| Key | Action |
| :--- | :--- |
| `ArrowRight` | Move to the first child, or to the next node when there are no children. |
| `ArrowLeft` | Move to the parent. |
| `ArrowDown` | Move to the next sibling, or to the next node when this is the last sibling. |
| `ArrowUp` | Move to the previous sibling, or else the previous node or the parent. |
| `Home` / `End` | Move to the first or last node. |

`Enter`, `Space`, `Escape` and the rest are listed on [Chart Overview](/components/chart).
