## Overview

Use a badge to show a short value that belongs to something next to it: how many unread messages a folder holds, or what state a deployment is in. It's text with a shape, so it reads as part of the element around it.

**Use a badge when you need to:**

- Count items, such as unread messages or open issues, beside the thing they belong to
- Show a status in a list or a table, such as `Live`, `Draft` or `Failed`
- Mark something as new, beta or deprecated

**Use something else when:**

- People can select or remove it: use a [Chip](/components/chip)
- The message needs a sentence and maybe an action: use an [Alert](/components/alert)
- It's a row count in a side navigation: `[monaSidebarMenuBadge]` in the [Sidebar](/components/sidebar/menus) is a badge that hides on the icon rail

## Import & Quick Start

```typescript
import { BadgeDirective } from "@nanahoshi/mona-ui/badge";
```

Add `BadgeDirective` to the `imports` array of a standalone component, and put `monaBadge` on an inline element:

```html
<span monaBadge look="success" fill="subtle">Live</span>
```

## Examples

### Status in a list

A `subtle` fill is quiet enough to repeat down a list. Each status says what it means in words, so the color only backs it up.

```example
badge/status
```

### Counts

A count beside a label reads as one phrase, "Inbox 12", which doesn't say what the 12 is. Add the missing word as visually hidden text inside the badge, so a screen reader hears "Inbox 12 unread". Remove the badge when the count is zero, rather than showing `0`.

```example
badge/counts
```

## Appearance & Styling

### Fills

| `fill`    | Appearance                                    |
|-----------|-----------------------------------------------|
| `solid`   | Filled with the look's color (default)        |
| `subtle`  | A light tint of the look's color, darker text |
| `outline` | Only a border in the look's color             |

### Looks

`look` is the color role: `secondary` (default), `primary`, `success`, `warning`, `error` and `info`. A `solid` badge uses the role's color and foreground, as a button of that look does, and a `subtle` one uses its tint and the darker text the theme pairs with it.

### Sizes and shapes

| `size`   | Height | Text      |
|----------|--------|-----------|
| `small`  | 16px   | 10px      |
| `medium` | 20px   | 12px (default) |
| `large`  | 24px   | 14px      |

`rounded` takes `none`, `small`, `medium` (default), `large` and `full`. `full` makes a pill, and a circle for a single digit. An icon inside a badge is sized with it.

### Custom classes

Classes passed via `class` are merged with the badge's own through `tailwind-merge`, so `class="ms-auto"` pushes a badge to the end of a row, and `class="rounded-none"` replaces the preset.

### Forced colors

A badge's fill doesn't paint in forced colors, so it keeps a border in the text color there, and the badge still reads as a shape.

## Accessibility

The directive adds no role, name or state, so the badge's text is read in place, as part of what's around it:

- **Say what a count counts.** Add visually hidden text, such as `<span class="sr-only">unread</span>`, or name the parent control so it includes the count.
- **Say the status in words.** Color and shape back the text up; they don't replace it.
- **Announce changes yourself.** A badge isn't a live region. If a count changing matters while someone is working, announce it, for example with a polite live region.
- **Keep it out of interactive roles.** A badge isn't focusable and has no keyboard interaction. To make it act, put it inside a button or link, or use a [Chip](/components/chip).
