## Overview

`SplitButtonComponent` is a compound control made of two adjacent buttons — a primary action button at the start and a menu toggle at the end (the right of it in left-to-right pages, the left in right-to-left ones) — that share the same visual style. Clicking the main button triggers `buttonClick` directly. Clicking the toggle opens a popup containing secondary actions structured as items, groups, separators, checkboxes, or radio groups.

**Use `SplitButtonComponent` when you need to:**

- Provide one default action alongside a set of related secondary actions (e.g., "Save" + "Save as…", "Publish" + "Schedule", "Download" + "Export formats")
- Keep the primary action one click away while making less-common actions discoverable without cluttering the toolbar

**Use `DropDownButtonComponent` instead when:**

- There is no single dominant action — all choices are peer options
- You do not need to distinguish between a primary click and a menu selection at the event level

## Import & Quick Start

```typescript
import { SplitButtonCheckboxItemComponent, SplitButtonComponent, SplitButtonGroupComponent, SplitButtonItemComponent, SplitButtonRadioGroupComponent, SplitButtonRadioItemComponent, SplitButtonSeparatorComponent } from "@nanahoshi/mona-ui/split-button";
```

Add the components you need to your standalone component's `imports` array.

**Minimal example — a button with two menu items:**

```html

<mona-split-button text="Save" (buttonClick)="onSave()">
    <mona-split-button-item label="Save as…" (menuClick)="onSaveAs($event)"></mona-split-button-item>
    <mona-split-button-item label="Export PDF" (menuClick)="onExport($event)"></mona-split-button-item>
</mona-split-button>
```

```typescript
import type { PopupMenuItemClickEvent } from "@nanahoshi/mona-ui/popup-menu";

protected onSave(): void { /* ... */ }
protected onSaveAs(event: PopupMenuItemClickEvent): void { /* ... */ }
protected onExport(event: PopupMenuItemClickEvent): void { /* ... */ }
```

## Anatomy

### Content projection slots

Menu items are projected directly inside `<mona-split-button>` as child components. Only the split-button family of components (`mona-split-button-item`, `mona-split-button-group`, etc.) and their associated `ng-template` directives are valid children.

```
mona-split-button
├── mona-split-button-item         — a regular clickable menu item
├── mona-split-button-group        — a titled group of items
│   └── mona-split-button-item
├── mona-split-button-separator    — a horizontal rule between groups
├── mona-split-button-checkbox-item — a toggle menu item
└── mona-split-button-radio-group  — a set of mutually exclusive choices
    └── mona-split-button-radio-item
```

### Template directives

All template directives target `ng-template` elements. Templates placed directly inside `mona-split-button` apply to all matching items globally; templates nested inside a specific item override only that item.

| Directive attribute                       | Scope         | Template context                                     |
|-------------------------------------------|---------------|------------------------------------------------------|
| `monaSplitButtonTextTemplate`             | Host button   | None                                                 |
| `monaSplitButtonMenuButtonTemplate`       | Toggle button | None                                                 |
| `monaSplitButtonMenuGroupTemplate`        | Global/Group  | `$implicit: string` (group title)                    |
| `monaSplitButtonMenuItemIconTemplate`     | Global/Item   | `$implicit` — menu item object (`label`, `disabled`) |
| `monaSplitButtonMenuItemShortcutTemplate` | Global/Item   | `$implicit` — menu item object (`label`, `disabled`) |
| `monaSplitButtonMenuItemTextTemplate`     | Global/Item   | `$implicit` — menu item object (`label`, `disabled`) |

**Customize the main button label:**

```html

<mona-split-button>
    <ng-template monaSplitButtonTextTemplate>
        <span class="text-primary font-semibold">Publish</span>
    </ng-template>
</mona-split-button>
```

**Customize the menu toggle icon:**

```html

<mona-split-button>
    <ng-template monaSplitButtonMenuButtonTemplate>
        <svg lucideEllipsis [size]="14"></svg>
    </ng-template>
</mona-split-button>
```

**Custom text per menu item:**

```html

<mona-split-button>
    <mona-split-button-item label="Sign Out">
        <ng-template monaSplitButtonMenuItemTextTemplate let-item>
            <span class="text-destructive">{{ item.label }}</span>
        </ng-template>
    </mona-split-button-item>
</mona-split-button>
```

**Global icon template (applies to all items):**

```html

<mona-split-button>
    <ng-template monaSplitButtonMenuItemIconTemplate let-item>
        <svg lucideChevronRight [size]="12"></svg>
    </ng-template>
    <mona-split-button-item label="Profile"></mona-split-button-item>
    <mona-split-button-item label="Settings"></mona-split-button-item>
</mona-split-button>
```

## Examples

### Groups, submenus and disabled items

Use `mona-split-button-group` to add a labeled section header, and `mona-split-button-separator` between sections. An item with child items opens a submenu. The main button emits `buttonClick`, and every menu item emits `menuItemClick`.

Both the whole component and individual items can be disabled independently: `[disabled]` on `mona-split-button` disables both buttons, and on an item disables only that item.

```example
split-button/basic
```

### Checkbox and radio items

`mona-split-button-checkbox-item` renders a toggleable item, and `mona-split-button-radio-group` a set of mutually exclusive options. Use `[(checked)]` and `[(value)]` for two-way binding, or the one-way input with `(checkedChange)` or `(valueChange)`.

```example
split-button/checkable
```

### Loading state

`loading` shows a spinner on the main button and keeps the menu from opening until it's `false` again.

```example
split-button/loading
```

## Behavior

### Popup positioning

The popup menu anchors to the start edge of the main button (its left edge in left-to-right pages, its right edge in right-to-left ones) with a 2px vertical offset. The `popupWidth` input sets the minimum width of the popup in pixels; `0` means no minimum width. Clicking the main button while the menu is open closes the menu, then emits `buttonClick`.

### Naming

The two buttons form a group (`role="group"`) named by the main button. The main button is named by its content: the `text`, or what a `monaSplitButtonTextTemplate` renders. Set `aria-label` only when the content isn't a name, as with `iconOnly`. The arrow is named "More {text} options" from `text` (or `aria-label`), or "Show menu options" when the main button has neither; `menuButtonAriaLabel` overrides it. Both come from the `splitButton` messages (`menuButtonWithText`, `menuButtonAriaLabel`). The `splitButton.splitButton` message is deprecated and no longer rendered.

### Loading, disabled and button groups

`loading` shows a spinner on the main button, marks the group busy (`aria-busy`) and keeps the menu from opening. Starting to load, or becoming disabled, closes an open menu. Inside `mona-button-group`, both buttons take the group's look, size, rounding and disabled state; they aren't toggles and take no part in the group's selection.

### Handling menu item events

`menuItemClick` on `SplitButtonComponent` fires for every item click in the popup (top-level aggregator). `menuClick` on individual `mona-split-button-item` / `mona-split-button-checkbox-item` / `mona-split-button-radio-item` fires only for that specific item. Use item-level `menuClick` when you need per-action handlers; use the top-level `menuItemClick` when you need a single entry point.

### Identifying the clicked item

The click event's `value` is the item's `value` input, so handlers don't need to compare label text. For checkbox and radio items, `checked` is the state the item has once the click is applied. Calling `event.preventDefault()` on a checkbox item's `menuClick` keeps its state, and on a radio item's keeps the group's value.

## Accessibility

### Keyboard navigation

| Key                             | Target            | Action                                                                                                |
|---------------------------------|-------------------|-------------------------------------------------------------------------------------------------------|
| `Tab`                           | Any button        | Move focus between the main button and the menu toggle                                                |
| `Enter` / `Space`               | Main button       | Trigger the primary action (`buttonClick`)                                                            |
| `Alt+ArrowDown` / `Alt+ArrowUp` | Main button       | Open the menu with its first / last item highlighted; focus returns to the main button when it closes |
| `ArrowDown` / `Enter` / `Space` | Menu toggle       | Open the menu with its first item highlighted                                                         |
| `ArrowUp`                       | Menu toggle       | Open the menu with its last item highlighted                                                          |
| `Escape`                        | Menu (while open) | Close the menu and return focus to the button that opened it                                          |

Inside the menu:

| Key               | Action                                                                                                      |
|-------------------|-------------------------------------------------------------------------------------------------------------|
| `ArrowDown`       | Highlights the next item, wrapping to the first. Disabled items are highlighted too, but can't be activated |
| `ArrowUp`         | Highlights the previous item, wrapping to the last                                                          |
| `ArrowRight`      | Opens the highlighted item's submenu, if it has nested items                                                |
| `ArrowLeft`       | Closes the current submenu and returns to the parent level                                                  |
| `Home`            | Highlights the first item                                                                                   |
| `End`             | Highlights the last item                                                                                    |
| `Enter` / `Space` | Activates the highlighted item, or opens its submenu if it has nested items                                 |
| `Escape`          | Closes the open submenu, or the menu, returning focus to the button that opened it                          |
| `Tab`             | Closes the menu and its submenus; focus moves on from the button that opened it                             |

### ARIA

The host carries `role="group"` and `aria-labelledby` pointing at the main button, and `aria-busy` while loading.

The menu toggle button carries:

- `aria-haspopup="menu"` — tells AT that it controls a menu popup
- `aria-expanded` — reflects the open/closed state of the popup
- `aria-controls` — references the menu by ID while it is open
- `id` — names the menu, through the menu's `aria-labelledby`
- `aria-label` — "More {text} options", or "Show menu options" without `text`; override with `[menuButtonAriaLabel]`

The main button carries:

- `aria-label` — only when the `[aria-label]` input is set; otherwise its content names it
- `aria-labelledby` — forwarded from the `[aria-labelledby]` input; takes precedence over `aria-label` when set

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] @description and @default kept in sync with source JSDoc (updated to canonical vocabulary)
- [x] aria-label and aria-labelledby are the inputs' aliases on this component
- [x] SplitButtonGroupComponent.title and SplitButtonRadioItemComponent.value marked Required (input.required<string>())
- [x] SplitButtonRadioGroupComponent.value documented as two-way bindable model
- [x] menuItemClick typed PopupMenuItemClickEvent (exported from @nanahoshi/mona-ui/popup-menu); buttonClick typed MouseEvent
- [x] Kind and Required columns removed from API tables; tables split into Inputs / Outputs per doc guidelines
- [x] No internal or unexported APIs exposed
- [x] ChangeDetectionStrategy.OnPush confirmed on all components
-->
