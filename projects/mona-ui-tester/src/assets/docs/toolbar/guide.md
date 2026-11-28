## Overview

Use a toolbar for a set of controls that act on the same thing, such as the text in an editor or the rows of a table. Grouping them saves keyboard users a Tab press per control: Tab enters and leaves the toolbar, and the arrow keys move inside it.

**Use a toolbar when you need to:**

- Offer formatting or editing commands above a document or an editor
- Put actions for a table or a selection in one row
- Keep a row of commands usable at every width, by moving what doesn't fit into a menu

**Use something else when:**

- The controls choose one value: use a [Segmented](/components/segmented) control or radio buttons
- The buttons are one control with a shared look: use a [Button Group](/components/button-group), which can sit inside a toolbar
- The row navigates between pages: use links, or the [Menubar](/components/menubar) for an application menu

## Import & Quick Start

```typescript
import { ToolbarComponent, ToolbarItemDirective } from "@nanahoshi/mona-ui/toolbar";
```

```html
<mona-toolbar aria-label="Formatting">
    <button monaButton monaToolbarItem type="button" aria-label="Bold" [iconOnly]="true" [toggleable]="true">
        <svg lucideBold [size]="16"></svg>
    </button>
    <button monaButton monaToolbarItem type="button">Insert table</button>
</mona-toolbar>
```

## Anatomy

| Part | What it is |
|------|------------|
| `mona-toolbar` | The row, with `role="toolbar"` and one Tab stop over every control in it |
| `monaToolbarItem` | Marks a control directly inside the toolbar as one that can move into the More menu |
| More button | Appears at the end when items are hidden, and opens a menu of them |
| `mona-separator` | Divides groups of controls. Marked `monaToolbarItem`, it moves with them and becomes a divider in the menu |

A control without `monaToolbarItem` always stays in the row, and still joins the Tab stop and the arrow keys.

## Examples

### Formatting toolbar

Drag the box's corner to narrow it. Items move into the More menu from the end, and a divider that would be left at the end goes with them. In the menu, Bold and the other toggles are checkbox items that show whether they're on, and choosing one clicks its button, so the button's own handlers run.

```example
toolbar/editor
```

### Wrapping instead

With `overflow="wrap"`, the controls flow onto more rows and nothing is hidden, which suits a few filters that should all stay visible. The search box sits outside the toolbar, since a text field keeps its arrow keys.

```example
toolbar/wrap
```

## Appearance & Styling

The toolbar is a flex row as wide as its container, with no border or background of its own. Add them with `class`, which is merged through `tailwind-merge`. `size` sets the gap between controls (`small` 2px, `medium` 4px, `large` 6px) and the More button's size; match it to the controls' size.

Controls keep their width rather than shrinking. Use `class="ms-auto"` on a control to push it, and those after it, to the end of the row.

## Behavior

### What moves into the menu

When the row is too narrow, the `monaToolbarItem`s move into the menu from the last one back, until the rest fit beside the More button. Items come back as the row widens. The toolbar measures again whenever it or one of its items changes size.

- `monaToolbarItem="never"` keeps a control in the row, such as a search box or a control a menu item can't stand in for.
- In the menu, an item takes its text from `overflowText`, then the control's `aria-label`, then its text. It's disabled while the control is disabled, and it's a checkbox item, checked while the control's `aria-pressed` is `true`.
- Choosing an item emits the item's `overflowActivate`, then clicks the control unless the event is prevented. A button needs nothing more. For a control a click doesn't operate, handle `overflowActivate`, or keep it in the row.
- Both come once the menu has closed and the focus is back on the More button, after the menu's closing animation. A dialog the control opens returns the focus to the More button when it closes.
- The menu is read from the hidden controls each time it opens, so their text and states are current.

If focus is on a control as it moves into the menu, focus moves to the More button.

### Wrapping

`overflow="wrap"` lets the row wrap, shows no More button and hides nothing.

## Accessibility

The toolbar has `role="toolbar"` and needs a name, from `aria-label` or `aria-labelledby`, which assistive technology reads on the way in. It warns in development without one.

| Key | Action |
|-----|--------|
| `Tab` | Moves into the toolbar, to the control last focused in it, and out of it |
| `ArrowRight` / `ArrowLeft` | Moves to the next or previous control, wrapping at the ends (mirrored in right-to-left layouts) |
| `Home` / `End` | Moves to the first or last control |
| `Enter`, `Space` | Activates the focused control; on the More button, opens the menu |

Disabled and hidden controls are skipped. A text field, slider or other control that uses Left and Right itself keeps those keys, so put it last in the toolbar, or outside it, and keyboard users can still reach every control.

The More button is named "More" in the current locale (`moreLabel` replaces it), has `aria-haspopup="menu"`, and says whether its menu is open with `aria-expanded`. The menu is named by the button and returns focus to it when it closes.
