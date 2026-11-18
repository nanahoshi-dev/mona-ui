## Overview

Multi Select Tree renders a combobox whose popup is a tree with checkboxes. The checked items show as removable tags in the field, and the value lists them. The popup opens on click, `Enter`, `Space`, `ArrowDown` or `Alt+ArrowDown`, and stays open while items are checked.

Checking follows the tree:

- **`checkChildren`** (on by default): checking an item checks its children, and unchecking it unchecks them.
- **`checkParents`** (on by default): an item is checked when all its children are, and unchecked when one isn't. An item with some of its children checked shows a mixed checkbox.

The data takes the shapes of the [dropdown tree](/components/dropdown-tree): hierarchical, with `children`, or flat, with `mode="flat"`, `idField` and `parentIdField`.

**Use Multi Select Tree when:**

- More than one item can be chosen from a hierarchy, such as permissions, regions or folders.

**Use `DropdownTree` instead when:**

- Exactly one item is chosen.

**Use `MultiSelect` instead when:**

- The options are a flat list.

## Import & Quick Start

```typescript
import { MultiSelectTreeComponent } from "@nanahoshi/mona-ui/multi-select-tree";
```

```typescript
protected readonly regions = [
    {
        code: "EU",
        name: "Europe",
        countries: [
            { code: "DE", name: "Germany" },
            { code: "FR", name: "France" }
        ]
    }
];

protected readonly countries = signal<string[]>([]);
```

```html
<mona-form-field label="Ships to">
    <mona-multi-select-tree
        children="countries"
        textField="name"
        valueField="code"
        [data]="regions"
        [valuePrimitive]="true"
        [(value)]="countries" />
</mona-form-field>
```

## Anatomy

Each template below is an `ng-template` placed inside `<mona-multi-select-tree>`.

| Directive                                | Selector                                         | Template context                         | Replaces                                        |
|------------------------------------------|--------------------------------------------------|------------------------------------------|-------------------------------------------------|
| `DropdownItemTemplateDirective`          | `ng-template[monaMultiSelectTreeItemTemplate]`   | `{ $implicit: TData }` (the node's item) | Each node's text in the popup                   |
| `MultiSelectTagTemplateDirective`        | `ng-template[monaMultiSelectTagTemplate]`        | `{ $implicit: TData }` (the tag's item)  | Each tag's text                                 |
| `MultiSelectSummaryTagTemplateDirective` | `ng-template[monaMultiSelectSummaryTagTemplate]` | `{ $implicit: value, tagCount: number }` | The summary tag's "+ n items"                   |
| `DropdownHeaderTemplateDirective`        | `ng-template[monaMultiSelectTreeHeaderTemplate]` | None                                     | No default; renders above the tree              |
| `DropdownFooterTemplateDirective`        | `ng-template[monaMultiSelectTreeFooterTemplate]` | None                                     | No default; renders below the tree              |
| `DropdownNoDataTemplateDirective`        | `ng-template[monaMultiSelectTreeNoDataTemplate]` | None                                     | "No data", or "No matching items" when filtered |
| `DropdownPrefixTemplateDirective`        | `ng-template[monaDropdownPrefixTemplate]`        | None                                     | No default; renders before the tags             |

The tag and summary tag directives, and `MultiSelectSummaryTagDirective`, come from `@nanahoshi/mona-ui/multi-select`, and the others from `@nanahoshi/mona-ui/dropdowns`. With a value whose items aren't loaded (and `valuePrimitive`), the tag template gets the value itself.

## Examples

### Granting permissions

Checking a group grants every permission in it, and a group whose permissions are all granted is checked itself. `monaMultiSelectSummaryTag` shows three tags and sums up the rest, and the filter box finds a permission by name. With `adaptiveMode="auto"`, the popup opens as a bottom sheet on a phone.

```example
multi-select-tree/permissions
```

### Signal Forms integration

A `minLength` rule on the field asks for at least one country, and the form field shows its message once the field is touched. With `checkParents` off, checking every country of a region leaves the region itself unchecked. Checking the region still checks its countries, and adds the region to the value too.

```example
multi-select-tree/forms
```

## Appearance & Styling

The multi-select tree has the sizes, corner roundings and states of the [multi-select](/components/multi-select): `size` is `small`, `medium` (default) or `large`, and `rounded` is `none`, `small`, `medium` (default), `large` or `full`. The tags wrap onto more lines as items are checked, and the popup moves with the field's bottom edge.

| Input             | What it does                                                                                                                              |
|-------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| `popupHeight`     | The popup's maximum height; 200 pixels when unset. Shorter trees shrink to fit.                                                           |
| `popupWidth`      | The popup's width; the field's width when unset.                                                                                          |
| `popupClass`      | Classes added to the popup.                                                                                                               |
| `showClearButton` | A button in the field that unchecks every item.                                                                                           |
| `adaptiveMode`    | `"auto"` opens the popup as a bottom sheet on a small screen, as described for the [dropdown tree](/components/dropdown-tree#on-a-phone). |

## Behavior

### The value's order

A change the user makes lists the checked items in the tree's order. A value set from code keeps its own order until the next change, and a value item whose node isn't loaded yet stays in the value, after the loaded ones.

### Tags

Each checked item has a tag. A tag's remove button unchecks its item as the tree does, so removing a group's tag unchecks the group's items with `checkChildren`. The summary tag's remove button unchecks only the items it stands for. `Backspace` in the field unchecks the item of the last tag.

### Clicking a node checks it

A click anywhere on a node's row checks or unchecks it, as a click on its checkbox does, and the popup stays open. The arrow on a node opens and closes it. A disabled item (`itemDisabled`) can't be checked or opened, and checking its parent leaves it as it is.

### Derived parents

With `checkParents`, an item whose children are all in a value set from code shows checked in the tree, but it joins the value only with the user's next change.

### `open` and `close` are cancelable

`open` and `close` emit a `PreventableEvent`; calling `preventDefault()` keeps the popup as it is. `opened` and `closed` follow once it has opened or closed.

## Forms Integration

The multi-select tree implements `FormValueControl<Iterable<TValue>>`, so `[formField]` binds it to a signal form field, which then sets `disabled`, `readonly`, `required`, `invalid` and `touched`. With `required`, it's invalid while nothing is checked. It also works with `[(ngModel)]` and reactive forms; a `null` value means nothing is checked.

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
| Letters and digits                                        | Open   | Moves to the next node whose text starts with them                              |
| `Enter` / `Space`                                         | Open   | Checks or unchecks the active node                                              |
| `Backspace`                                               | Any    | Unchecks the item of the last tag                                               |
| `Escape`, `Alt+ArrowUp`                                   | Open   | Closes the popup                                                                |
| `Tab`                                                     | Open   | Closes the popup and moves focus on                                             |

In the filter box, `ArrowDown`, `ArrowUp` and `Enter` work as above, and the other keys edit the text.

### Focus

Focus stays on the field while the popup is open; the active node is shown with a focus ring and announced through `aria-activedescendant`. With a filter box, focus moves into it when the popup opens, and returns to the field when the popup closes. Tags and their remove buttons aren't Tab stops: `Backspace` removes tags from the keyboard.

### ARIA

- The field has `role="combobox"`, `aria-haspopup="tree"`, `aria-expanded`, and `aria-controls` pointing at the tree. It's named by `aria-label`, `aria-labelledby`, a form field's label or, failing those, the placeholder.
- The popup's tree has `role="tree"` and the field's name. Its nodes are `treeitem`s with `aria-checked` (`mixed` for a partly checked parent), `aria-level`, `aria-setsize`, `aria-posinset` and `aria-expanded` on nodes with children. A disabled node has `aria-disabled`.
- Each tag's remove button is named "Remove" and the item's text, and the summary tag's "Remove n more items".
- The filter box is a combobox too, named "Filter" and the field's name. How many items match is announced as the filter changes.
