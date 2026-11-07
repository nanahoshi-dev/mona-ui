## Overview

Use `PopupMenuComponent` when the element that opens the menu is yours: it doesn't render a trigger, it attaches to one.

**Use a closely related Mona UI component instead when:**

- You just want a button with a menu: use `DropdownButtonComponent`, or `SplitButtonComponent` if one action is the main one. Both set up the button's ARIA for you.
- The menu opens on right-click: use `ContextMenuComponent`, which also handles the `ContextMenu` key and `Shift+F10`.
- You need a persistent application menu bar: use `MenubarComponent`.

## Import & Quick Start

```typescript
import { PopupMenuComponent, PopupMenuItemComponent } from "@nanahoshi/mona-ui/popup-menu";
```

Add the components you need to your standalone component's `imports` array. Pass the element that opens the menu as `target`.

```html
<button #actions monaButton type="button" aria-label="Row actions" aria-haspopup="menu">
    <svg lucideEllipsis [size]="16" aria-hidden="true"></svg>
</button>

<mona-popup-menu [target]="actions" (menuClick)="onAction($event)">
    <mona-popup-menu-item label="Edit" value="edit"></mona-popup-menu-item>
    <mona-popup-menu-item label="Delete" value="delete"></mona-popup-menu-item>
</mona-popup-menu>
```

```typescript
import type { PopupMenuItemClickEvent } from "@nanahoshi/mona-ui/popup-menu";

protected onAction(event: PopupMenuItemClickEvent): void {
    console.log(event.value);
}
```

## Anatomy

Items are projected directly inside `<mona-popup-menu>`.

```
mona-popup-menu
├── mona-popup-menu-item           — an action; items projected inside it make a submenu
├── mona-popup-menu-group          — consecutive items under a title
│   └── mona-popup-menu-item
├── mona-popup-menu-separator      — a divider
├── mona-popup-menu-checkbox-item  — an on/off setting
└── mona-popup-menu-radio-group    — one choice among several
    └── mona-popup-menu-radio-item
```

### Template directives

A template placed directly inside `<mona-popup-menu>` applies to every matching item. One placed inside an item applies to that item only.

| Directive                      | Applies to | `$implicit`         |
|--------------------------------|------------|---------------------|
| `monaPopupMenuGroupTemplate`   | Menu       | The group's title   |
| `monaPopupMenuIconTemplate`    | Menu, item | The menu item       |
| `monaPopupMenuShortcutTemplate`| Menu, item | The menu item       |
| `monaPopupMenuTextTemplate`    | Menu, item | The menu item       |

## Examples

### Submenus, groups and separators

```html
<mona-popup-menu [target]="more">
    <mona-popup-menu-group title="File">
        <mona-popup-menu-item label="Rename"></mona-popup-menu-item>
        <mona-popup-menu-item label="Share">
            <mona-popup-menu-item label="Copy link"></mona-popup-menu-item>
            <mona-popup-menu-item label="Email"></mona-popup-menu-item>
        </mona-popup-menu-item>
    </mona-popup-menu-group>
    <mona-popup-menu-separator></mona-popup-menu-separator>
    <mona-popup-menu-item label="Delete" [disabled]="readOnly()"></mona-popup-menu-item>
</mona-popup-menu>
```

### Checkbox and radio items

```html
<mona-popup-menu [target]="view">
    <mona-popup-menu-checkbox-item label="Show hidden files" [(checked)]="showHidden"></mona-popup-menu-checkbox-item>
    <mona-popup-menu-radio-group title="Sort by" [(value)]="sort">
        <mona-popup-menu-radio-item label="Name" value="name"></mona-popup-menu-radio-item>
        <mona-popup-menu-radio-item label="Date" value="date"></mona-popup-menu-radio-item>
    </mona-popup-menu-radio-group>
</mona-popup-menu>
```

### Items from data

`items` takes plain `MenuItem` objects, and replaces any projected items when it isn't empty.

```typescript
import type { MenuItem } from "@nanahoshi/mona-ui/popup-menu";

protected readonly items: MenuItem[] = [
    { label: "Edit", value: "edit" },
    { label: "Share", items: [{ label: "Copy link", value: "link" }] },
    { separator: true, label: "" },
    { label: "Archived", checkable: true, checked: false, value: "archived" }
];
```

```html
<mona-popup-menu [target]="actions" [items]="items" (menuClick)="onAction($event)"></mona-popup-menu>
```

### Icons and shortcuts

```html
<mona-popup-menu-item label="Save">
    <ng-template monaPopupMenuIconTemplate>
        <svg lucideSave [size]="14" aria-hidden="true"></svg>
    </ng-template>
    <ng-template monaPopupMenuShortcutTemplate>
        <span class="text-xs">Ctrl + S</span>
    </ng-template>
</mona-popup-menu-item>
```

### Opening it from code

Set `trigger` to `"none"` when the target shouldn't open the menu by itself, and call `openMenu()` when it should open. The target still decides where it appears.

```html
<div #row>{{ name() }}</div>
<mona-popup-menu #rowMenu trigger="none" [target]="row">
    <mona-popup-menu-item label="Edit"></mona-popup-menu-item>
</mona-popup-menu>
<button monaButton type="button" (click)="rowMenu.openMenu()">Show actions</button>
```

### Positioning against another element

`anchor` positions the menu against a different element from the one that opens it. The connection points choose which corner of each attaches to the other.

```html
<div #toolbar class="flex">
    <button #overflow monaButton type="button" aria-label="More" aria-haspopup="menu">…</button>
</div>
<mona-popup-menu
    anchorConnectionPoint="bottomleft"
    popupConnectionPoint="topleft"
    [anchor]="toolbar"
    [offset]="{ horizontal: 0, vertical: 2 }"
    [target]="overflow">
    <mona-popup-menu-item label="Export"></mona-popup-menu-item>
</mona-popup-menu>
```

## Appearance & Styling

`size` and `rounded` apply to the menu and its submenus, and so do `width` and `minWidth`, which take a number of pixels or a CSS length. `class` adds classes to the menu's popup.

```html
<mona-popup-menu class="max-h-80" rounded="large" size="small" [minWidth]="200" [target]="actions">
    <mona-popup-menu-item label="Edit"></mona-popup-menu-item>
</mona-popup-menu>
```

## Behavior

- **Toggling:** with `trigger="click"`, clicking the target while the menu is open closes it.
- **Closing:** the menu closes when an item is activated, on `Escape`, on a click outside, and on scroll.
- **Keeping it open:** call `preventDefault()` on the `menuClick` event to keep the menu open and leave a checkbox or radio item as it was. Prevented on the item, the menu's own `menuClick` isn't emitted. Calling it on the `close` event stops that close.
- **Checkable data items:** a `MenuItem` with `checkable` holds its state inside the menu. Read the new state from the event's `checked`, and keep it in your items if they can be replaced.
- **Disabled items** stay in the arrow-key order, so screen reader users learn they exist, but they can't be activated.
- **Target element:** `target` must be an element in the DOM, passed as a template reference or an `ElementRef`.

## Accessibility

Inside the menu, the keyboard works the same as in every Mona UI menu:

| Key                               | Action                                                                 |
|-----------------------------------|------------------------------------------------------------------------|
| `ArrowDown` / `ArrowUp`           | The next or previous item, wrapping around.                            |
| `Home` / `End`                    | The first or last item.                                                |
| `ArrowRight` (`ArrowLeft` in RTL) | Opens the highlighted item's submenu.                                  |
| `ArrowLeft` (`ArrowRight` in RTL) | Closes the submenu, back to its parent item.                           |
| `Enter` / `Space`                 | Activates the item, or opens its submenu.                              |
| `Escape`                          | Closes the open submenu, or the menu.                                  |
| `Tab`                             | Closes every open menu, and focus moves on from where the menu opened. |
| A letter, digit, `-` or `_`       | Jumps to the next item whose label starts with what was typed.         |

When the menu closes, focus returns to where it was when the menu opened, or to the target if it can take focus.

**What you provide:** unlike `DropdownButtonComponent`, this component doesn't change your target element, so its ARIA is yours to set.

- Use a focusable element as the target, ideally a native `<button>`, so `Enter` and `Space` can open the menu.
- Give the target `aria-haspopup="menu"`, `aria-expanded`, and `aria-controls` while the menu is open.
- Name the menu with `aria-label` or `aria-labelledby`. Without either, the menu is named by the target if it has an `id`.
- To open with a highlighted item as a dropdown button does, call `openMenuViaKeyboard()` from your key handler.

```html
<button
    #actions
    id="row-actions"
    monaButton
    type="button"
    aria-haspopup="menu"
    [attr.aria-controls]="menuOpen() ? 'row-actions-menu' : null"
    [attr.aria-expanded]="menuOpen()"
    (keydown.arrowdown)="$event.preventDefault(); menu.openMenuViaKeyboard()"
    (keydown.arrowup)="$event.preventDefault(); menu.openMenuViaKeyboard(false, 'last')">
    Actions
</button>

<mona-popup-menu
    #menu
    id="row-actions-menu"
    [target]="actions"
    (close)="menuOpen.set(false)"
    (open)="menuOpen.set(true)">
    <mona-popup-menu-item label="Edit"></mona-popup-menu-item>
</mona-popup-menu>
```

## API

### `PopupMenuComponent`

**Selector:** `mona-popup-menu`

#### Inputs

| Name                    | Type                                     | Default    | Description                                                                                                                  |
|-------------------------|------------------------------------------|------------|------------------------------------------------------------------------------------------------------------------------------|
| `anchor`                | `ElementRef<HTMLElement> \| Element`     | —          | The element to position the menu against, when it isn't the `target`. Ignored when `openAtPointer` is set.                   |
| `anchorConnectionPoint` | `ConnectionPoint \| null`                | —          | The point on the anchor that the menu attaches to. Ignored when `openAtPointer` is set.                                      |
| `aria-label`            | `string`                                 | `""`       | The accessible name of the root menu. Takes precedence over `aria-labelledby`.                                               |
| `aria-labelledby`       | `string`                                 | `""`       | The ids of the elements that name the root menu. Without this or `aria-label`, the target names the menu if it has an `id`. |
| `class`                 | `ClassInputType`                         | —          | Extra classes for the menu's popup.                                                                                          |
| `id`                    | `string`                                 | `""`       | The id of the menu's root element.                                                                                           |
| `items`                 | `Iterable<PopupMenuItem \| MenuItem>`    | `[]`       | The items to render. When not empty, replaces projected items.                                                               |
| `minWidth`              | `string \| number`                       | —          | The minimum width of the menu and its submenus.                                                                              |
| `offset`                | `PopupOffset`                            | —          | The distance between the menu and its anchor.                                                                                |
| `openAtPointer`         | `boolean`                                | `false`    | Opens the menu where the pointer is, instead of against the `anchor` or `target`. From the keyboard, at the target's center. |
| `popupConnectionPoint`  | `ConnectionPoint \| null`                | —          | The point on the menu that attaches to the anchor. Ignored when `openAtPointer` is set.                                      |
| `rounded`               | `'large' \| 'medium' \| 'none' \| 'small'` | `'medium'` | The border radius of the menu and its submenus.                                                                              |
| `size`                  | `'large' \| 'medium' \| 'small'`         | `'medium'` | The size of the menu and its submenus.                                                                                       |
| `target` (required)     | `ElementRef<HTMLElement> \| Element`     | —          | The element that opens the menu. The menu is positioned against it unless `anchor` is set.                                   |
| `trigger`               | `PopupMenuTrigger`                       | `'click'`  | What opens the menu: `'click'`, `'contextmenu'`, or `'none'` to open it only through `openMenu()`.                           |
| `width`                 | `string \| number`                       | —          | The width of the menu and its submenus.                                                                                      |

`ConnectionPoint` is `'topleft'`, `'topcenter'`, `'topright'`, `'centerleft'`, `'center'`, `'centerright'`, `'bottomleft'`, `'bottomcenter'` or `'bottomright'`, from `@nanahoshi/mona-ui/popup`.

#### Outputs

| Name        | Type                       | Description                                                                 |
|-------------|----------------------------|-----------------------------------------------------------------------------|
| `close`     | `PopupMenuCloseEvent`      | Emitted before the menu closes. Call `preventDefault()` to keep it open.    |
| `menuClick` | `PopupMenuItemClickEvent`  | Emitted when an item is activated by a click, `Enter` or `Space`.           |
| `navigate`  | `PopupMenuNavigationEvent` | Emitted when an arrow key moves through the menu, or tries to leave it.     |
| `open`      | `void`                     | Emitted when the menu opens.                                                |

#### Methods

| Method                | Parameters                                                         | Description                                                                                  |
|-----------------------|--------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| `closeMenu`           | —                                                                  | Closes the menu. Focus returns to where it was, unless it has moved elsewhere.               |
| `openMenu`            | `viaContextMenuKey = false`                                        | Opens the menu, as if the target had been clicked.                                           |
| `openMenuViaKeyboard` | `viaContextMenuKey = false`, `focus: 'first' \| 'last' = 'first'`  | Opens the menu as the keyboard does, with its first or last item highlighted.                |

### `PopupMenuItemComponent`

**Selector:** `mona-popup-menu-item`

| Name        | Kind   | Type                      | Default | Description                                                  |
|-------------|--------|---------------------------|---------|--------------------------------------------------------------|
| `disabled`  | Input  | `boolean`                 | `false` | Keeps the item from being activated.                         |
| `label`     | Input  | `string`                  | `""`    | The item's text and accessible name.                         |
| `value`     | Input  | `unknown`                 | —       | Identifies the item in `menuClick` events.                   |
| `menuClick` | Output | `PopupMenuItemClickEvent` | —       | Emitted when the item is activated, before the menu's event. |

### `PopupMenuCheckboxItemComponent`

**Selector:** `mona-popup-menu-checkbox-item`. Has the same members as `PopupMenuItemComponent`, plus:

| Name      | Kind  | Type      | Default | Description                                     |
|-----------|-------|-----------|---------|-------------------------------------------------|
| `checked` | Model | `boolean` | `false` | Whether the item is checked. Binds two-way.     |

### `PopupMenuRadioGroupComponent`

**Selector:** `mona-popup-menu-radio-group`

| Name    | Kind  | Type     | Default | Description                                        |
|---------|-------|----------|---------|----------------------------------------------------|
| `title` | Input | `string` | `""`    | The group's title.                                 |
| `value` | Model | `string` | `""`    | The value of the selected item. Binds two-way.     |

### `PopupMenuRadioItemComponent`

**Selector:** `mona-popup-menu-radio-item`. Has the same members as `PopupMenuItemComponent`, except that `value` is a required `string`.

### `PopupMenuGroupComponent`

**Selector:** `mona-popup-menu-group`

| Name    | Kind  | Type     | Default | Description                                                  |
|---------|-------|----------|---------|--------------------------------------------------------------|
| `title` | Input | `string` | —       | The group's title. Without one, no header is rendered.       |

### `PopupMenuSeparatorComponent`

**Selector:** `mona-popup-menu-separator`. Has no inputs or outputs.

### `MenuItem`

| Property    | Type         | Description                                                              |
|-------------|--------------|--------------------------------------------------------------------------|
| `checkable` | `boolean`    | Makes the item a checkbox item. Its state toggles when it's activated.   |
| `checked`   | `boolean`    | The item's initial checked state.                                        |
| `disabled`  | `boolean`    | Keeps the item from being activated.                                     |
| `group`     | `string`     | The title of its group. Consecutive items with the same group form one.  |
| `items`     | `MenuItem[]` | The items of its submenu.                                                |
| `label`     | `string`     | Required. The item's text.                                               |
| `separator` | `boolean`    | Renders the item as a divider.                                           |
| `value`     | `unknown`    | Identifies the item in `menuClick` events.                               |
