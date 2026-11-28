## Overview

Dropdown Tree renders a single-value combobox whose popup is a tree. The field shows the selected item's text (or a placeholder), and the popup opens on click, `Enter`, `Space`, `ArrowDown` or `Alt+ArrowDown`. Choosing an item, by click or with `Enter`, selects it and closes the popup, whichever level it's on.

The data is a tree in one of two shapes, as in the [tree view](/components/tree-view):

- **Hierarchical** (the default): each item holds its children, named by `children`. `children` can also be a function that returns an observable, which loads a node's children the first time it opens.
- **Flat**: one list, with `mode="flat"`, where `idField` and `parentIdField` link each item to its parent.

**Use Dropdown Tree when:**

- The options form a hierarchy, and a parent can be chosen as well as a leaf.
- The hierarchy is too deep or too long for grouped options in a [dropdown list](/components/dropdown-list).

**Use `MultiSelectTree` instead when:**

- More than one item can be chosen at once.

**Use `TreeView` instead when:**

- The tree is part of the page, not a field in a form.

## Import & Quick Start

```typescript
import { DropdownTreeComponent } from "@nanahoshi/mona-ui/dropdown-tree";
```

```typescript
protected readonly categories = [
    {
        id: "clothing",
        name: "Clothing",
        items: [
            { id: "shirts", name: "Shirts" },
            { id: "trousers", name: "Trousers" }
        ]
    },
    { id: "footwear", name: "Footwear", items: [{ id: "boots", name: "Boots" }] }
];

protected readonly category = signal<string | null>(null);
```

```html
<mona-form-field label="Category">
    <mona-dropdown-tree
        children="items"
        textField="name"
        valueField="id"
        [data]="categories"
        [valuePrimitive]="true"
        [(value)]="category" />
</mona-form-field>
```

`textField`, `valueField` and `children` each take a property name or an accessor function. `valueField` identifies each item: it matches a value set from code to its node, and with `valuePrimitive` it's what the value holds instead of the whole item.

## Anatomy

Each template below is an `ng-template` placed inside `<mona-dropdown-tree>`.

| Directive                            | Selector                                      | Template context                                   | Replaces                                        |
|--------------------------------------|-----------------------------------------------|----------------------------------------------------|-------------------------------------------------|
| `DropdownItemTemplateDirective`      | `ng-template[monaDropDownTreeItemTemplate]`   | `{ $implicit: TData }` (the node's item)           | Each node's text in the popup                   |
| `DropdownTreeValueTemplateDirective` | `ng-template[monaDropDownTreeValueTemplate]`  | `{ $implicit: TData \| null }` (the selected item) | The selected item's text in the field           |
| `DropdownHeaderTemplateDirective`    | `ng-template[monaDropDownTreeHeaderTemplate]` | None                                               | No default; renders above the tree              |
| `DropdownFooterTemplateDirective`    | `ng-template[monaDropDownTreeFooterTemplate]` | None                                               | No default; renders below the tree              |
| `DropdownNoDataTemplateDirective`    | `ng-template[monaDropDownTreeNoDataTemplate]` | None                                               | "No data", or "No matching items" when filtered |
| `DropdownPrefixTemplateDirective`    | `ng-template[monaDropdownPrefixTemplate]`     | None                                               | No default; renders before the value            |

The generic selectors of the other dropdowns, such as `monaDropDownItemTemplate`, work too. The item, header, footer and "no data" directives come from `@nanahoshi/mona-ui/dropdowns`, and the value template from `@nanahoshi/mona-ui/dropdown-tree`.

## Examples

### Choosing a category

The value is the category's id. `monaDropDownFilterable` puts a filter box in the popup: matching items show with their parents, which open to show them, and the first match becomes the active node, so `Enter` picks it. The form field names the dropdown tree, and its hint describes it. With `adaptiveMode="auto"`, the popup opens as a bottom sheet on a phone.

```example
dropdown-tree/categories
```

### Loading children as nodes open

`children` returns an observable of a folder's subfolders, which loads them the first time the folder opens, and `hasChildren` tells which folders have any before they load. A load that takes a moment is announced. The value is the whole folder item.

```example
dropdown-tree/lazy-loading
```

### Flat data, disabled items and templates

With `mode="flat"`, the teams are one list linked by `parentId`. `itemDisabled` names a field that disables an item: an archived team can't be chosen, and neither can its children. The item template adds a note to archived teams, and the value template shows the selected team in the field.

```example
dropdown-tree/flat-data
```

## Appearance & Styling

The dropdown tree has the sizes, corner roundings and states of the [dropdown list](/components/dropdown-list): `size` is `small`, `medium` (default) or `large`, and `rounded` is `none`, `small`, `medium` (default), `large` or `full`.

| Input             | What it does                                                                                 |
|-------------------|----------------------------------------------------------------------------------------------|
| `popupHeight`     | The popup's maximum height; 200 pixels when unset. Shorter trees shrink to fit.              |
| `popupWidth`      | The popup's width; the field's width when unset.                                             |
| `popupClass`      | Classes added to the popup.                                                                  |
| `showClearButton` | A button in the field that clears the value.                                                 |
| `adaptiveMode`    | `"auto"` opens the popup as a bottom sheet on a small screen. See [On a phone](#on-a-phone). |

## Behavior

### Opening on the selected item

The popup opens with the selected item as its active node, and the item's parents open to show it. With nothing selected, the first node is active. As the filter changes, its first match becomes the active node. Closing the popup clears the filter.

### Clicking or pressing Enter selects and closes

A click on a node, or `Enter` or `Space` on the active node, selects it and closes the popup, even when it's already selected. The arrow on a node opens and closes it without selecting it. `Escape`, `Tab` and a click outside close the popup and leave the value as it was.

### Values set from code

A value set from code selects the node it matches through `valueField`. When the node isn't loaded yet (its parent hasn't opened), the field still shows the value's text for an object value; a primitive value shows only once its node loads, so give lazily loaded trees object values.

### On a phone

With `adaptiveMode="auto"`, on a screen narrower than 640 pixels, the popup opens as a sheet along the bottom of the screen, over a dimmed page. The sheet has the field's name, or `adaptiveTitle`, and a close button. Its nodes are 44 pixels tall, to be easy to tap. Focus stays where it is, as with the popup under the field: on the field, or in the filter box. While an on-screen keyboard is open, the sheet sits above it.

### `open` and `close` are cancelable

`open` and `close` emit a `PreventableEvent`; calling `preventDefault()` keeps the popup as it is. `opened` and `closed` follow once it has opened or closed.

## Forms Integration

The dropdown tree implements `FormValueControl<TValue | null>`, so `[formField]` binds it to a signal form field, which then sets `disabled`, `readonly`, `required`, `invalid` and `touched`. It's touched when focus leaves it and its popup. It also works with `[(ngModel)]` and reactive forms.

## Accessibility

### Keyboard

| Key                                                       | When   | Action                                                                          |
|-----------------------------------------------------------|--------|---------------------------------------------------------------------------------|
| `Enter`, `Space`, `ArrowDown`, `ArrowUp`, `Alt+ArrowDown` | Closed | Opens the popup                                                                 |
| `ArrowDown` / `ArrowUp`                                   | Open   | Moves to the next or previous visible node                                      |
| `ArrowRight`                                              | Open   | Opens a closed node, or moves to its first child (`ArrowLeft` in right-to-left) |
| `ArrowLeft`                                               | Open   | Closes an open node, or moves to its parent (`ArrowRight` in right-to-left)     |
| `Home` / `End`                                            | Open   | Moves to the first or last visible node                                         |
| `*`                                                       | Open   | Opens the active node's siblings                                                |
| Typed characters                                          | Open   | Moves to the next node whose text starts with them; the same character typed again steps on to the next node that starts with it |
| `Enter` / `Space`                                         | Open   | Selects the active node and closes the popup                                    |
| `Escape`, `Alt+ArrowUp`                                   | Open   | Closes the popup without changing the value                                     |
| `Tab`                                                     | Open   | Closes the popup and moves focus on                                             |

In the filter box, `ArrowDown`, `ArrowUp` and `Enter` work as above, and the other keys edit the text.

### Focus

Focus stays on the field while the popup is open, as for the other dropdowns; the active node is shown with a focus ring and announced through `aria-activedescendant`. With a filter box, focus moves into it when the popup opens, and returns to the field when the popup closes.

### ARIA

- The field has `role="combobox"`, `aria-haspopup="tree"`, `aria-expanded`, and `aria-controls` pointing at the tree. It's named by `aria-label`, `aria-labelledby`, a form field's label or, failing those, the placeholder.
- The popup's tree has `role="tree"` and the field's name. Its nodes are `treeitem`s with `aria-level`, `aria-setsize`, `aria-posinset`, `aria-expanded` on nodes with children, and `aria-selected` on the selected node. A disabled node has `aria-disabled`, and a node whose children are loading has `aria-busy`.
- The filter box is a combobox too, named "Filter" and the field's name. How many items match is announced as the filter changes.
- `loading` sets `aria-busy` on the field.
