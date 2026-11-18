## Overview

Use a separator to divide content that belongs together from content that doesn't: the header of a panel from its body, or two ways to sign in. In a row, a vertical one divides items such as a date and a reading time.

**Use a separator when you need to:**

- Divide a panel, a card or a form into parts without a heading for each
- Offer two alternatives, with "or" between them
- Separate items in a row of metadata or links

**Use something else when:**

- The parts deserve names: use headings, which also help people navigate
- The line divides items in a menu: menus have their own separator items, such as `mona-dropdown-button-separator`
- The groups are in a toolbar: a separator works there too, and a toolbar item moves it into its More menu with the items around it

## Import & Quick Start

```typescript
import { SeparatorComponent } from "@nanahoshi/mona-ui/separator";
```

```html
<mona-separator class="my-4" />
<mona-separator label="or" />
<mona-separator orientation="vertical" />
```

## Examples

### Two ways to sign in

A labelled separator reads its label as text, "or", and the lines around it stay out of the way.

```example
separator/sign-in
```

### Across and down

The horizontal separator between the heading and the details is announced, since it marks where the details start. The vertical ones only space out items that already read apart, so they're `decorative`.

```example
separator/inline
```

## Appearance & Styling

| `orientation` | Line | Size |
|---------------|------|------|
| `horizontal` (default) | Across its container | 1px tall, full width |
| `vertical` | Down its row | 1px wide, the row's height. Give the row a height, or items that set one. |

The line is drawn in the theme's border color. A labelled separator is always horizontal, with the label in small muted text between two lines.

The separator has no margin of its own. Add one with `class`, such as `class="my-4"`, which is merged with its own classes through `tailwind-merge`; `class="bg-primary"` recolors the line.

In forced colors, where backgrounds don't paint, the line takes the text color.

## Accessibility

| Separator | Role | Notes |
|-----------|------|-------|
| Horizontal | `separator` | Horizontal is the role's default, so it has no `aria-orientation` |
| Vertical | `separator` | With `aria-orientation="vertical"` |
| `decorative` | None | Skipped by assistive technology |
| With a `label` | None | The label is read as text; a separator's role would hide it |

Mark a separator `decorative` when it repeats a boundary the content already makes, such as between cards with their own borders, or between items that a screen reader reads apart anyway. A separator isn't focusable and has no keyboard interaction.
