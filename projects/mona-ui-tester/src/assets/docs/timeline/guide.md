## Overview

Give the timeline its events. It shows them in the order of the array, reading each event's date, title, subtitle and description from its fields: `date`, `title`, `subtitle` and `description` by default.

**Use Timeline when:**

- Things happened, or will happen, in an order that matters: a project's milestones, a company's history, a changelog, an order's progress.
- Each event needs a few lines of its own, more than a row of a table.

To guide users through the steps of a task they're doing, use a [stepper](/components/stepper). For many events that people filter, sort or page through, use a [list view](/components/list-view) or a [grid](/components/grid).

## Import & Quick Start

```typescript
import { TimelineComponent } from "@nanahoshi/mona-ui/timeline";
```

```html
<mona-timeline aria-label="Project milestones" [data]="milestones" />
```

```typescript
protected readonly milestones = [
    { date: "2026-01-12", title: "Research", subtitle: "Discovery team", description: "Interviews with twelve customers." },
    { date: "2026-03-02", title: "Design", subtitle: "Product design", description: "A clickable prototype." }
];
```

`dateField`, `titleField`, `subtitleField` and `descriptionField` name the fields to read when yours are called something else. An event without a date, a subtitle or a description just leaves it out.

## Anatomy

| Directive | Selector | Replaces |
| --- | --- | --- |
| `TimelineHeaderTemplateDirective` | `ng-template[monaTimelineHeaderTemplate]` | The card's title and subtitle |
| `TimelineBodyTemplateDirective` | `ng-template[monaTimelineBodyTemplate]` | The card's description |
| `TimelineDateTemplateDirective` | `ng-template[monaTimelineDateTemplate]` | The date label |
| `TimelineMarkerTemplateDirective` | `ng-template[monaTimelineMarkerTemplate]` | The dot on the line |

Each template's context is the event (`let-event`), its `date` as a `Date` or `null`, whether its details are open (`expanded`), and its `index`. Bind the timeline's data to the directive's `Of` input, such as `[monaTimelineBodyTemplateOf]="steps"`, to type the event; without it, the event is `any`.

The header is the event's heading, and on a collapsible timeline the button that opens its details, so keep a header template to text and images: no links or controls. A body template can hold anything.

## Examples

### Down the page

By default, the line runs down the start side, with each event's date above its card.

```example
timeline/basic
```

### Alternating sides

`alternate` puts the cards after the line and before it in turn, with each date across from its card. Below 32rem wide, the timeline goes back to one side, so it fits a phone. `dateFormat` shows the years alone here.

```example
timeline/alternate
```

### Across the page

`orientation="horizontal"` runs the timeline across the page, with the dates above the line and the cards below it, scrolling sideways when they don't fit. With `alternate`, the cards go below the line and above it in turn. The `--mona-timeline-event-width` custom property sets how wide each event is, 16rem by default.

```example
timeline/horizontal
```

### Collapsible details

With `collapsible`, each card's header is a button that opens and closes its details, all closed to start. `expandedKeys` holds the open events; bind it two-way to follow the user and to open or close events yourself. `keyField` names the field that identifies an event in it, so an open event stays open when the data is replaced with copies.

```example
timeline/collapsible
```

### Status markers and templates

The marker template shows each step's status as an icon, with its name for screen readers. The date template adds the time of day, or "Expected by" for the step still to come, and the body template adds the place.

```example
timeline/templates
```

## Appearance & Styling

Each card has the raised surface of a [card](/components/card). The marker is a dot in the primary color, and the line is the border color. In forced colors, the dot, the line and the cards' borders are drawn in the system's text color.

A marker template sits centered on the line, beside the date or the card's title. It can be larger than the dot, such as an icon in a circle; on a horizontal timeline, the line's row grows to fit it.

| Custom property | Default | Sets |
| --- | --- | --- |
| `--mona-timeline-event-width` | `16rem` | The width of each event on a horizontal timeline |

Set it with a class on the timeline, such as `class="[--mona-timeline-event-width:20rem]"`.

## Behavior

### Order and dates

The events keep the order of `data`, so sort them the way they should read: oldest first, or newest first, as in a changelog.

An event's date can be a `Date`, a timestamp in milliseconds or an ISO 8601 string. A string is in local time unless it gives an offset, so `"2026-03-02"` is March 2 wherever it's read. `dateFormat` formats it in the locale, `{ dateStyle: "medium" }` by default, as in "Mar 2, 2026"; give it `{ year: "numeric" }` for years, or `{ dateStyle: "medium", timeStyle: "short" }` for a time of day too.

### Layout

A vertical timeline fills its container's width. An alternating one lays its events out by its own width, not the page's: at 32rem and wider, the cards take turns on either side of the line, and below that, they're all after it. A horizontal timeline gives each event the same width and scrolls sideways; the line runs straight through the middle of the markers, whatever the cards' heights.

The timeline follows the layout's direction: in a right-to-left layout, the line runs down the right side, and a horizontal timeline runs from right to left.

### Opening and closing

On a collapsible timeline, the details open and close with a short height animation, or at once when the user prefers reduced motion. An event without details, with no description and no body template, has a plain header. Closed details are inert, so their content can't be focused or found.

## Accessibility

The timeline is an ordered list, named by `aria-label` or `aria-labelledby`. Each event is an item that reads its date first, in a `<time>` element whose `datetime` holds the date in ISO 8601, then its card. The title is a heading, level 3 by default; set `headingLevel` to fit the page's outline, or to `null` for no headings.

The marker is read too, which a template can use: give an icon `aria-hidden="true"`, and add text that says what it means, as the status example does. The dot and the line aren't read.

### Keyboard

On a collapsible timeline, each header with details is a button, one Tab stop each. A horizontal timeline is a Tab stop too, so the arrow keys can scroll it.

| Key | Action |
| --- | --- |
| `Tab` / `Shift+Tab` | Moves focus through the headers' buttons, and to a horizontal timeline |
| `Enter` / `Space` | Opens or closes the details of the focused header |
| `ArrowLeft` / `ArrowRight` | Scrolls a focused horizontal timeline |

### ARIA

| Attribute | When present | Value |
| --- | --- | --- |
| `aria-label` / `aria-labelledby` | On the list, when given | The timeline's name |
| `tabindex` | On the list of a horizontal timeline | `"0"` |
| `role` / `aria-level` | On each title, unless `headingLevel` is `null` | `"heading"` and the level |
| `aria-expanded` | On each header's button, on a collapsible timeline | Whether the details are open |
| `aria-controls` | On each header's button, on a collapsible timeline | The id of its details |
