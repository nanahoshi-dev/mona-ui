## Overview

Use Tree View to let a consumer browse or act on data that has parent-child relationships, such as a file system, a category tree, or an org chart. The data can be shaped as nested items (hierarchical mode) or as a flat list linked by an id and a parent id (flat mode).

Selection, checking, disabling, expand/collapse control, filtering, and drag-and-drop reordering are all opt-in. None of these behaviors are active until the corresponding attribute directive is applied to the `<mona-tree-view>` host element:

- `monaTreeViewSelectable` — single or multiple selection.
- `monaTreeViewCheckable` — a checkbox per node, with check propagation to children and parents.
- `monaTreeViewDisable` — disables nodes (and, by default, their descendants).
- `monaTreeViewExpandable` — expanders on parent nodes and controlled expand/collapse. Without it, every node is shown expanded and can't be collapsed — see [Without `monaTreeViewExpandable` every node is open](#without-monatreeviewexpandable-every-node-is-open).
- `monaTreeViewFilterable` — a filter input above the tree.
- `monaTreeViewDragAndDrop` — reordering and reparenting nodes by dragging.

**Use `Grid` instead when:**

- The data is naturally tabular rather than hierarchical.

**Use `DropDownList`, `ComboBox` or `MultiSelect` instead when:**

- The consumer is choosing from a flat collection of options rather than navigating a hierarchy.

## Import & Quick Start

```typescript
import { TreeViewComponent } from "@nanahoshi/mona-ui/tree-view";
```

Each behavior directive (`TreeViewSelectableDirective`, `TreeViewCheckableDirective`, `TreeViewDisableDirective`, `TreeViewExpandableDirective`, `TreeViewFilterableDirective`, `TreeViewDragAndDropDirective`) and `TreeViewNodeTemplateDirective` is imported from the same entry point and added to the component's `imports` next to `TreeViewComponent`.

`textField` and either `children` (hierarchical mode) or `idField` / `parentIdField` (flat mode) are required for the tree to render nodes from `data`. When `textField` is empty, the data item itself is shown as the node's text.

```typescript
interface FileItem {
    id: string;
    text: string;
    items: FileItem[];
}

protected readonly data: FileItem[] = [
    {
        id: "1",
        text: "src",
        items: [
            { id: "1-1", text: "index.ts", items: [] },
            { id: "1-2", text: "app.ts", items: [] }
        ]
    },
    { id: "2", text: "package.json", items: [] }
];
```

```html
<mona-tree-view ariaLabel="Documents" [data]="data" children="items" textField="text"></mona-tree-view>
```

Give every tree a name with `ariaLabel` or `ariaLabelledBy` — see [ARIA](#aria).

## Anatomy

Consumers interact with the following selectors directly:

- `mona-tree-view` — the root component.
- `ng-template[monaTreeViewNodeTemplate]` — replaces the default node text with projected content. The template context exposes `$implicit` (the node's data item) and `element` (the node's content element, a `mona-tree-node`).
- `mona-tree-view[monaTreeViewSelectable]`, `mona-tree-view[monaTreeViewCheckable]`, `mona-tree-view[monaTreeViewDisable]`, `mona-tree-view[monaTreeViewExpandable]`, `mona-tree-view[monaTreeViewFilterable]`, `mona-tree-view[monaTreeViewDragAndDrop]` — attribute directives applied to the `mona-tree-view` host element to enable each behavior.

| Directive                       | Selector                                | Template context                                                           | Replaces                               |
| ------------------------------- | --------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------- |
| `TreeViewNodeTemplateDirective` | `ng-template[monaTreeViewNodeTemplate]` | `TreeViewNodeTemplateContext<T>`: `{ $implicit: T, element: HTMLElement }` | The default node text from `textField` |

```html
<mona-tree-view ariaLabel="Documents" [data]="data" children="items" textField="text">
    <ng-template monaTreeViewNodeTemplate [monaTreeViewNodeTemplateOf]="data" let-dataItem let-element="element">
        <span>{{ dataItem.text }}</span>
    </ng-template>
</mona-tree-view>
```

Bind the tree's data to `[monaTreeViewNodeTemplateOf]` to type `$implicit` in the template; without it, the data item is `any`. The context type, `TreeViewNodeTemplateContext<T>`, is exported for annotating a `TemplateRef`. The node's name is its template content, so keep it short: it is what screen readers read for the node. See [Keys inside node templates](#keys-inside-node-templates) before placing controls in a node template.

## Examples

### Flat data

Set `mode="flat"` and provide `idField` and `parentIdField` instead of `children` when the source data is a flat list linked by id references. Items whose parent id is `null` or missing are the root nodes; an item whose parent id matches no item is not shown.

```typescript
protected readonly data = [
    { id: "1", text: "Electronics", parentId: null },
    { id: "1-1", text: "Laptops", parentId: "1" },
    { id: "1-2", text: "Phones", parentId: "1" }
];
```

The [checking example](#checking) uses flat data.

### Selection

Apply `monaTreeViewSelectable` to track which nodes are selected. Single mode is the default; pass `{ mode: 'multiple' }` to allow multiple selected nodes. In single mode, `toggleable: true` lets the user deselect the selected node by clicking it (or pressing Enter) again; `childrenOnly: true` makes only nodes without children selectable.

```example
tree-view/selection
```

`selectBy` derives the key used for `selectedKeys`/`selectedKeysChange`; when omitted, the data item itself is the key. The same holds for `checkBy`, `disableBy` and `expandBy` below.

### Checking

Apply `monaTreeViewCheckable` to render checkboxes on nodes. Checking a parent also checks its children, checking all of a parent's children checks the parent, and a parent shows an indeterminate state when only some of its children are checked, unless configured otherwise through the directive's options (`checkChildren`, `checkParents`, `mode: "single"`). Use `hasCheckbox` to show checkboxes on some nodes only.

```example
tree-view/checking
```

### Disabling nodes

Apply `monaTreeViewDisable` and pass the keys of the nodes to disable. Disabling a node also disables its descendants by default (`disableChildren`). A disabled node can still be moved to with the keyboard, but it can't be clicked, selected, checked, expanded, collapsed or dragged.

```html
<mona-tree-view
    ariaLabel="Documents"
    [data]="data"
    children="items"
    textField="text"
    monaTreeViewDisable
    disableBy="id"
    [disabledKeys]="['1-2']"></mona-tree-view>
```

### Controlled expand/collapse

Apply `monaTreeViewExpandable` to show an expander on every node with children, and bind `expandedKeys` and `expandedKeysChange` to control which nodes are expanded from outside the component. Without the directive, every node is shown expanded.

```html
<mona-tree-view
    ariaLabel="Documents"
    [data]="data"
    children="items"
    textField="text"
    monaTreeViewExpandable
    expandBy="id"
    [expandedKeys]="expandedKeys()"
    (expandedKeysChange)="expandedKeys.set($event)"></mona-tree-view>
```

### Filtering

Apply `monaTreeViewFilterable` to show a filter input above the tree that narrows the visible nodes to those whose text matches, plus their ancestors, and expands those ancestors. By default a node matches when its text contains the filter text, ignoring case; the options' `operator` (`"contains"`, `"startsWith"`, `"endsWith"` or a function), `caseSensitive` and `debounce` (how long after the user stops typing the filter applies; a filter set from code applies at once) change that. Bind `[(filter)]` to read the text or set it from code (setting it back to `""` clears the filter, even after the user typed). `filterInput` fires first with a cancelable `FilterChangeEvent`. The expansion a filter applies is view state: it isn't reported through `expandedKeysChange` and is undone when the filter is cleared. Lazily loaded children that haven't been loaded yet aren't searched.

```html
<mona-tree-view
    ariaLabel="Documents"
    [data]="data"
    children="items"
    textField="text"
    monaTreeViewFilterable
    filterPlaceholder="Filter documents"
    [(filter)]="filter"></mona-tree-view>
```

### Drag and drop reordering

Apply `monaTreeViewDragAndDrop` to let the consumer reorder or reparent nodes by dragging them with the mouse or by touch, or by moving them with the keyboard. Dropping near the top or bottom edge of a node places the dragged node before or after it; dropping on the rest of the node places it inside, as its last child. A node can't be dropped onto itself or into its own subtree, and disabled nodes can't be dragged.

A drop changes nothing by itself: the tree emits `nodeDrop`, and the consumer applies the move. Use the exported `moveTreeNode` (hierarchical data) or `moveFlatTreeNode` (flat data) helper inside the `nodeDrop` handler to compute an updated array and pass it back through `data`. `moveTreeNode` returns a new top-level array and updates nested children arrays in place, so untouched data items keep their identity and their tree state; `moveFlatTreeNode` returns a new array in which the moved item is replaced by a copy with its parent id updated, so key the flat tree's state with `selectBy`, `checkBy` and `expandBy` rather than by data item.

```example
tree-view/drag-and-drop
```

For flat data, call `moveFlatTreeNode(this.data(), event, "id", "parentId")` instead.

The keyboard moves the active node with Ctrl+Shift+Arrow (Cmd+Shift+Arrow on macOS): ArrowUp and ArrowDown move it before its previous or after its next visible sibling, ArrowRight (ArrowLeft in RTL) moves it into its previous sibling as the last child, and ArrowLeft (ArrowRight in RTL) moves it out, after its parent. A keyboard move emits the same `nodeDrop` as a drop, with the `KeyboardEvent` as `originalEvent`, so the handler above serves both. Once the handler has applied the move, the node stays active, a node it moved into opens, and the move is announced ("Apple moved after Bread"); a move the handler didn't apply isn't announced. Disabled nodes don't move, and nothing moves into a disabled node.

### Lazy-loaded children

Pass a function returning an `Observable` as `children` to load a node's children on first expand instead of upfront. Provide `hasChildren` so unexpanded nodes can render an expander before their children are fetched, and apply `monaTreeViewExpandable`: without it there is no expander and nothing triggers the load. Loaded children are cached, so collapsing and expanding the node again doesn't request them again. A node expanded through `expandedKeys`, from the start or later, loads its children once it is shown. Pass the function as a property (an arrow function), not a method, so it keeps `this`.

While children load, the node is expanded and `aria-busy`, its expander reads "Loading {node}", and a load that takes more than a moment (400 ms) is announced. If the observable errors, `childrenLoadError` emits with the node and the error, the failure is announced, and the node is collapsed again and described as failed ("Couldn't load the items in {node}"); its expander reads "Retry loading {node}", and expanding it loads again.

```example
tree-view/lazy-loading
```

To handle a failed load, listen to `childrenLoadError`: the node is collapsed again and expanding it retries, so log or report `event.error` there.

## Behavior

### Cancelable events

`nodeSelect`, `nodeCheck`, `nodeClick`, `nodeDragStart`, `nodeDrop`, and `filterInput` emit an event object with `preventDefault()` and `isDefaultPrevented()`. Calling `preventDefault()` in a handler stops the corresponding state change (selection, check, the click's selection, drag, or filter) from being applied. A drop changes nothing by itself, so `preventDefault()` on `nodeDrop` tells the tree the move wasn't applied: it doesn't move focus to the dropped node. `nodeDrag` and `nodeDragEnd` aren't cancelable: a drag always ends, and `preventDefault()` on `nodeDragEnd` has no effect. `nodeSelect` and `selectionChange` fire only when the selection would change: clicking (or pressing Enter on) the selected node of a single selection that isn't `toggleable` fires neither.

### Data modes

Switching `mode` requires providing the matching fields: `children` for `"hierarchical"`, or `idField` and `parentIdField` for `"flat"`. The two field sets are independent inputs and are not cross-validated. In hierarchical mode, a new `data` value reuses the node of every data object the tree already had, so lazily loaded children and the active node survive a refresh such as the one after `moveTreeNode`. In flat mode the nodes are rebuilt on every refresh; the active node is kept by its `idField` value, so it survives `moveFlatTreeNode` too. Changing `textField` doesn't rebuild the nodes.

### Without `monaTreeViewExpandable` every node is open

Without `monaTreeViewExpandable` (or with `{ enabled: false }`), every node with children is rendered expanded, has no expander and no `aria-expanded`, and can't be collapsed: the collapse key moves to the parent, `*` does nothing, and no expanded keys are written. Apply the directive for collapsible trees and for lazily loaded children.

### Moving nodes from code

`TreeViewComponent` exposes `moveNode(source, target, position)` and `undoMoveNode(snapshot)` for moving nodes in the tree's internal structure directly, without going through `data`. `moveNode` returns `null`, and changes nothing, for a move it can't make: onto the node itself or into its own subtree, inside the node's own parent or inside a disabled node, or `"outside"`. The `nodeDrop` event's `treeView` property refers to the emitting `TreeViewComponent` instance, typed as the exported `ITreeView<T>`.

### Each tree view has its own state

Every `mona-tree-view` provides its own tree state, so several trees on a page, or a tree inside another component's template, never share selection, checks, expansion or filter text.

### Keys inside node templates

Keys pressed in a control placed in a node template (an input, a button, a nested tree) are left to that control: the tree only handles keys pressed while it has focus itself. The control still isn't a Tab stop of its own unless you make it one, and a click on it also activates its node.

## Forms Integration

Tree View does not implement `ControlValueAccessor` or the signal forms `FormValueControl` / `FormCheckboxControl` interfaces. It cannot be bound with `[(ngModel)]`, `[formControl]`, `formControlName`, or `[formField]`. Track selection or check state through the `selectedKeys` / `checkedKeys` inputs and their `selectedKeysChange` / `checkedKeysChange` outputs, or the `selectionChange` / `nodeSelect` / `nodeCheck` outputs, exposed by the selectable and checkable directives.

## Accessibility

### Keyboard

The arrow keys that open and close nodes follow the tree's text direction (the nearest `dir`, or the application's direction): in a right-to-left tree, ArrowLeft and ArrowRight swap.

| Key                                    | Action                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ArrowDown`                            | Move to the next visible node. From the last node, wraps to the first.                                                                                                                                                                                                                                                                         |
| `ArrowUp`                              | Move to the previous visible node. From the first node, wraps to the last.                                                                                                                                                                                                                                                                     |
| `Home`                                 | Move to the first visible node.                                                                                                                                                                                                                                                                                                                |
| `End`                                  | Move to the last visible node.                                                                                                                                                                                                                                                                                                                 |
| `ArrowRight` (LTR) / `ArrowLeft` (RTL) | On a closed node with children, expand it (loading lazy children). On an open node, move to its first child. On a node without children, nothing.                                                                                                                                                                                              |
| `ArrowLeft` (LTR) / `ArrowRight` (RTL) | On an open node, collapse it. On a closed node, a node without children, or a node that can't be collapsed (disabled, or expanding is off), move to its parent. On a root node, nothing else.                                                                                                                                                  |
| `*`                                    | Expand the active node and all of its siblings that have children.                                                                                                                                                                                                                                                                             |
| `Enter`                                | With `monaTreeViewSelectable`, select the active node. In multiple mode, or in single mode with `toggleable`, Enter on a selected node deselects it; otherwise Enter on the selected node does nothing. `nodeSelect` fires first and can cancel it. With `childrenOnly`, nodes with children aren't selected.                                  |
| `Space`                                | With `monaTreeViewCheckable`, check or uncheck the active node when it has a checkbox (`hasCheckbox`, and only nodes without children with `childrenOnly`). `nodeCheck` fires first and can cancel it.                                                                                                                                         |
| Any letter or digit, `-` or `_`        | Typeahead: move to the next visible node, after the active one and wrapping around, whose text starts with the typed characters (ignoring case). Keys typed within 200 ms build one prefix, and the active node stays while it still matches the longer prefix ("ap" on Apple stays on Apple); after a pause the next key starts a new search. |
| `Ctrl`+`Shift`+arrow (`Cmd` on macOS)  | With `monaTreeViewDragAndDrop`, move the active node: ArrowUp / ArrowDown before its previous or after its next sibling, ArrowRight (LTR) into its previous sibling, ArrowLeft (LTR) out after its parent. See [Drag and drop reordering](#drag-and-drop-reordering).                                                                          |

Disabled nodes can be moved to, but Enter, Space, the expand and collapse keys, `*` and the move keys leave them as they are. Visible nodes are those not hidden by a collapsed ancestor or by the filter. Other keys held with Ctrl, Alt or Meta, and keys pressed while an input method is composing text, are left to the page.

### Focus

The tree is the only Tab stop; individual nodes are not part of the page's tab order. Arrow-key navigation moves an internal active node pointer, reflected through `aria-activedescendant` on the tree element, instead of moving DOM focus between nodes. Clicking a node makes it the active node. When the tree regains focus, it restores the previously active node, or activates the first node if none was active yet; when the active node is hidden by a collapse or the filter, its nearest visible ancestor (else the first visible node) takes over. The active node has a solid 2px ring while the tree has focus; an empty tree stays a Tab stop and draws the ring around its "No data" or "No matching items" text. The filter input is a separate Tab stop before the tree, and it doesn't take focus when the tree renders.

### ARIA

The tree element is the `mona-tree` element inside `mona-tree-view`; the `mona-tree-view` host itself has no role.

| Element         | Attribute                                     | When present                                                                                                                  | Value                                                                          |
| --------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Tree            | `role`                                        | Always                                                                                                                        | `tree`                                                                         |
| Tree            | `aria-label`                                  | When the `ariaLabel` input is set                                                                                             | The `ariaLabel` value                                                          |
| Tree            | `aria-labelledby`                             | When the `ariaLabelledBy` input is set                                                                                        | The `ariaLabelledBy` value                                                     |
| Tree            | `aria-describedby`                            | When no node is shown                                                                                                         | The "No data" or "No matching items" text                                      |
| Tree            | `aria-multiselectable`                        | When selectable with `mode: "multiple"` and not checkable                                                                     | `true`                                                                         |
| Tree            | `aria-activedescendant`                       | While a node is active                                                                                                        | The active node's element id                                                   |
| Tree            | `aria-keyshortcuts`                           | With `monaTreeViewDragAndDrop`                                                                                                | The four Ctrl+Shift+arrow move keys                                            |
| Child node list | `role`                                        | The nested list of an expanded node                                                                                           | `group`                                                                        |
| Node            | `role`                                        | Always                                                                                                                        | `treeitem`                                                                     |
| Node            | `aria-level`, `aria-setsize`, `aria-posinset` | Always                                                                                                                        | The node's depth and position among its visible siblings                       |
| Node            | `aria-labelledby`                             | Always                                                                                                                        | The node's content, so the expander and nested nodes aren't part of its name   |
| Node            | `aria-expanded`                               | When `monaTreeViewExpandable` is on and the node has children (with an asynchronous `children`, when `hasChildren` says so)   | `true` / `false`; `true` while its children load                               |
| Node            | `aria-busy`                                   | While its children load                                                                                                       | `true`                                                                         |
| Node            | `aria-describedby`                            | When its children failed to load                                                                                              | "Couldn't load the items in {node}"                                            |
| Node            | `aria-selected`                               | When selectable is enabled and not checkable (a node reports one state; with checkboxes, selection is shown but not reported) | `true` / `false`                                                               |
| Node            | `aria-disabled`                               | When the node is disabled                                                                                                     | `true`                                                                         |
| Node            | `aria-checked`                                | When the node is checkable                                                                                                    | `true` / `false` / `mixed`                                                     |
| Expander        | `aria-label`                                  | On each expander button (not a Tab stop)                                                                                      | "Expand {node}", "Collapse {node}", "Loading {node}" or "Retry loading {node}" |
| Filter          | `role="search"`, `aria-label`                 | When filterable                                                                                                               | A search landmark around the filter input, named like the input                |
| Filter input    | `aria-label`, `aria-controls`                 | When filterable                                                                                                               | "Filter {name}" from the tree's name (or "Filter tree"), and the tree's id     |

Name every tree with `ariaLabel` or `ariaLabelledBy`; in development, an unnamed tree logs a warning. A plain `aria-label` attribute on `mona-tree-view` doesn't name the tree. The filter input's name is built from `ariaLabel`, or else from the text of the `ariaLabelledBy` elements. After the user types in the filter, the number of matching nodes is announced ("3 results", or "No matching items"); a filter set from code isn't announced. A keyboard move is announced once it's applied ("Apple moved into Fruits"). Each node's checkbox is hidden from assistive technology, because the node itself reports `aria-checked`. Announcements and labels are translated messages (`treeView` namespace); `TREE_VIEW_DEFAULT_MESSAGES` holds the English defaults.
