## Overview & Component Selection

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

## Anatomy & Public Structural Templates

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

## Feature Examples

### Flat data

Set `mode="flat"` and provide `idField` and `parentIdField` instead of `children` when the source data is a flat list linked by id references. Items whose parent id is `null` or missing are the root nodes; an item whose parent id matches no item is not shown.

```typescript
protected readonly data = [
    { id: "1", text: "Electronics", parentId: null },
    { id: "1-1", text: "Laptops", parentId: "1" },
    { id: "1-2", text: "Phones", parentId: "1" }
];
```

```html
<mona-tree-view
    ariaLabel="Categories"
    [data]="data"
    mode="flat"
    idField="id"
    parentIdField="parentId"
    textField="text"></mona-tree-view>
```

### Selection

Apply `monaTreeViewSelectable` to track which nodes are selected. Single mode is the default; pass `{ mode: 'multiple' }` to allow multiple selected nodes. In single mode, `toggleable: true` lets the user deselect the selected node by clicking it (or pressing Enter) again; `childrenOnly: true` makes only nodes without children selectable.

```html
<mona-tree-view
    ariaLabel="Documents"
    [data]="data"
    children="items"
    textField="text"
    [monaTreeViewSelectable]="{ mode: 'multiple' }"
    selectBy="id"
    [selectedKeys]="selectedKeys()"
    (selectedKeysChange)="selectedKeys.set($event)"></mona-tree-view>
```

`selectBy` derives the key used for `selectedKeys`/`selectedKeysChange`; when omitted, the data item itself is the key. The same holds for `checkBy`, `disableBy` and `expandBy` below.

### Checking

Apply `monaTreeViewCheckable` to render checkboxes on nodes. Checking a parent also checks its children, checking all of a parent's children checks the parent, and a parent shows an indeterminate state when only some of its children are checked, unless configured otherwise through the directive's options (`checkChildren`, `checkParents`, `mode: "single"`). Use `hasCheckbox` to show checkboxes on some nodes only.

```html
<mona-tree-view
    ariaLabel="Documents"
    [data]="data"
    children="items"
    textField="text"
    monaTreeViewCheckable
    checkBy="id"
    [checkedKeys]="checkedKeys()"
    (checkedKeysChange)="checkedKeys.set($event)"></mona-tree-view>
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

Apply `monaTreeViewFilterable` to show a filter input above the tree that narrows the visible nodes to those whose text matches, plus their ancestors, and expands those ancestors. By default a node matches when its text contains the filter text, ignoring case; the options' `operator` (`"contains"`, `"startsWith"`, `"endsWith"` or a function), `caseSensitive` and `debounce` change that. Bind `[(filter)]` to read the text or set it from code (setting it back to `""` clears the filter, even after the user typed). `filterInput` fires first with a cancelable `FilterChangeEvent`. The expansion a filter applies is view state: it isn't reported through `expandedKeysChange` and is undone when the filter is cleared. Lazily loaded children that haven't been loaded yet aren't searched.

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

Apply `monaTreeViewDragAndDrop` to let the consumer reorder or reparent nodes by dragging them with the mouse. Dropping near the top or bottom edge of a node places the dragged node before or after it; dropping on the rest of the node places it inside, as its last child. A node can't be dropped onto itself or into its own subtree, and disabled nodes can't be dragged.

A drop changes nothing by itself: the tree emits `nodeDrop`, and the consumer applies the move. Use the exported `moveTreeNode` (hierarchical data) or `moveFlatTreeNode` (flat data) helper inside the `nodeDrop` handler to compute an updated array and pass it back through `data`. `moveTreeNode` returns a new top-level array and updates nested children arrays in place, so untouched data items keep their identity and their tree state; `moveFlatTreeNode` returns a new array in which the moved item is replaced by a copy with its parent id updated, so key the flat tree's state with `selectBy`, `checkBy` and `expandBy` rather than by data item.

```html
<mona-tree-view
    ariaLabel="Documents"
    [data]="data()"
    children="items"
    textField="text"
    monaTreeViewDragAndDrop
    (nodeDrop)="onNodeDrop($event)"></mona-tree-view>
```

```typescript
import { moveTreeNode, type NodeDropEvent } from "@nanahoshi/mona-ui/tree-view";

protected readonly data = signal<FileItem[]>([]);

protected onNodeDrop(event: NodeDropEvent<FileItem>): void {
    this.data.set(moveTreeNode(this.data(), event, "id", "items"));
}
```

For flat data, call `moveFlatTreeNode(this.data(), event, "id", "parentId")` instead. Dragging has no keyboard equivalent; offer another way to move nodes (for example a "Move to…" command) when reordering is essential.

### Lazy-loaded children

Pass a function returning an `Observable` as `children` to load a node's children on first expand instead of upfront. Provide `hasChildren` so unexpanded nodes can render an expander before their children are fetched, and apply `monaTreeViewExpandable`: without it there is no expander and nothing triggers the load. Loaded children are cached, so collapsing and expanding the node again doesn't request them again. Pass the function as a property (an arrow function), not a method, so it keeps `this`.

While children load, the node is expanded and `aria-busy`, its expander reads "Loading {node}", and a load that takes more than a moment (400 ms) is announced. If the observable errors, `childrenLoadError` emits with the node and the error, the failure is announced, and the node is collapsed again and described as failed ("Couldn't load the items in {node}"); its expander reads "Retry loading {node}", and expanding it loads again.

```html
<mona-tree-view
    ariaLabel="Folders"
    [data]="data"
    [children]="loadChildren"
    [hasChildren]="hasChildren"
    textField="text"
    monaTreeViewExpandable
    expandBy="id"
    (childrenLoadError)="onLoadError($event)"></mona-tree-view>
```

```typescript
import { type ChildrenLoadErrorEvent } from "@nanahoshi/mona-ui/tree-view";

interface FolderItem {
    id: string;
    text: string;
    hasChildren: boolean;
}

readonly #api = inject(FolderApi);

protected readonly data: FolderItem[] = [{ id: "1", text: "Documents", hasChildren: true }];

protected readonly loadChildren = (item: FolderItem): Observable<FolderItem[]> => this.#api.getChildren(item.id);

protected readonly hasChildren = (item: FolderItem): boolean => item.hasChildren;

protected onLoadError(event: ChildrenLoadErrorEvent<FolderItem>): void {
    // The node is collapsed again and expanding it retries; log or report the error here.
    console.error(event.error);
}
```

## Technical & Behavior Notes

### Cancelable events

`nodeSelect`, `nodeCheck`, `nodeClick`, `nodeDragStart`, `nodeDragEnd`, `nodeDrop`, and `filterInput` emit an event object with `preventDefault()` and `isDefaultPrevented()`. Calling `preventDefault()` in a handler stops the corresponding state change (selection, check, the click's selection, drag, drop, or filter) from being applied. `nodeDrag` is not cancelable.

### Data modes

Switching `mode` requires providing the matching fields: `children` for `"hierarchical"`, or `idField` and `parentIdField` for `"flat"`. The two field sets are independent inputs and are not cross-validated. In hierarchical mode, a new `data` value reuses the node of every data object the tree already had, so lazily loaded children and the active node survive a refresh such as the one after `moveTreeNode`. Changing `textField` doesn't rebuild the nodes.

### Without `monaTreeViewExpandable` every node is open

Without `monaTreeViewExpandable` (or with `{ enabled: false }`), every node with children is rendered expanded, has no expander and no `aria-expanded`, and can't be collapsed. Apply the directive for collapsible trees and for lazily loaded children.

### Moving nodes from code

`TreeViewComponent` exposes `moveNode(source, target, position)` and `undoMoveNode(snapshot)` for moving nodes in the tree's internal structure directly, without going through `data`. The `nodeDrop` event's `treeView` property refers to the emitting `TreeViewComponent` instance, typed as the exported `ITreeView<T>`.

### Each tree view has its own state

Every `mona-tree-view` provides its own tree state, so several trees on a page, or a tree inside another component's template, never share selection, checks, expansion or filter text.

### Keys inside node templates

The tree handles the keys pressed anywhere inside it, including in controls placed in a node template: arrows, Home, End, `*`, Enter, Space and typeahead characters are taken by the tree. Keep node templates to static content (text, icons, badges).

## Accessibility & Forms Integration

### Keyboard

The arrow keys that open and close nodes follow the tree's text direction (the nearest `dir`, or the application's direction): in a right-to-left tree, ArrowLeft and ArrowRight swap.

| Key                                    | Action                                                                                                                                                                                                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ArrowDown`                            | Move to the next visible node. From the last node, wraps to the first.                                                                                                                                                                                                               |
| `ArrowUp`                              | Move to the previous visible node. From the first node, wraps to the last.                                                                                                                                                                                                           |
| `Home`                                 | Move to the first visible node.                                                                                                                                                                                                                                                      |
| `End`                                  | Move to the last visible node.                                                                                                                                                                                                                                                       |
| `ArrowRight` (LTR) / `ArrowLeft` (RTL) | On a closed node with children, expand it (loading lazy children). On an open node, move to its first child. On a node without children, nothing.                                                                                                                                    |
| `ArrowLeft` (LTR) / `ArrowRight` (RTL) | On an open node, collapse it. On a closed node or a node without children, move to its parent. On a root node that isn't open, nothing.                                                                                                                                              |
| `*`                                    | Expand the active node and all of its siblings that have children.                                                                                                                                                                                                                   |
| `Enter`                                | With `monaTreeViewSelectable`, select the active node. In multiple mode, or in single mode with `toggleable`, Enter on a selected node deselects it. `nodeSelect` fires first and can cancel it. With `childrenOnly`, nodes with children aren't selected.                           |
| `Space`                                | With `monaTreeViewCheckable`, check or uncheck the active node when it has a checkbox (`hasCheckbox`, and only nodes without children with `childrenOnly`). `nodeCheck` fires first and can cancel it.                                                                               |
| Any letter or digit, `-` or `_`        | Typeahead: move to the next visible node, after the active one and wrapping around, whose text starts with the typed characters (ignoring case). Keys typed within 200 ms build one prefix; after a pause the next key starts a new search. Ignored while Ctrl, Alt or Meta is held. |

Disabled nodes can be moved to, but Enter, Space, the expand and collapse keys and `*` leave them as they are. Visible nodes are those not hidden by a collapsed ancestor or by the filter.

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
| Filter input    | `aria-label`, `aria-controls`                 | When filterable                                                                                                               | "Filter {name}" from `ariaLabel` (or "Filter tree"), and the tree's id         |

Name every tree with `ariaLabel` or `ariaLabelledBy`; in development, an unnamed tree logs a warning. A plain `aria-label` attribute on `mona-tree-view` doesn't name the tree. The filter input takes its name from `ariaLabel` only: a tree named through `ariaLabelledBy` gets a filter named "Filter tree". After the user types in the filter, the number of matching nodes is announced ("3 results", or "No matching items"); a filter set from code isn't announced. Each node's checkbox is hidden from assistive technology, because the node itself reports `aria-checked`. Announcements and labels are translated messages (`treeView` namespace); `TREE_VIEW_DEFAULT_MESSAGES` holds the English defaults.

### Form Interaction

Tree View does not implement `ControlValueAccessor` or the signal forms `FormValueControl` / `FormCheckboxControl` interfaces. It cannot be bound with `[(ngModel)]`, `[formControl]`, `formControlName`, or `[formField]`. Track selection or check state through the `selectedKeys` / `checkedKeys` inputs and their `selectedKeysChange` / `checkedKeysChange` outputs, or the `selectionChange` / `nodeSelect` / `nodeCheck` outputs, exposed by the selectable and checkable directives.

## API

### `TreeViewComponent<T>`

**Selector:** `mona-tree-view`

#### Inputs

| Name             | Type                            | Default          | Description                                                                                                                                                                                                  |
| ---------------- | ------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `animate`        | `boolean`                       | `true`           | Enables CSS transitions when nodes expand or collapse. Accepts the attribute form (`animate="false"`). Transitions are skipped while a filter is applied and shortened when the user prefers reduced motion. |
| `ariaLabel`      | `string`                        | `""`             | Accessible name of the tree. Also names the filter input ("Filter {name}"). Set this or `ariaLabelledBy`.                                                                                                    |
| `ariaLabelledBy` | `string`                        | `""`             | Id of the element that names the tree, as an alternative to `ariaLabel`.                                                                                                                                     |
| `children`       | `ChildrenSelector<T>`           | `""`             | Property name, or a function returning a node's children (synchronously or as an `Observable`). Used in hierarchical mode.                                                                                   |
| `data`           | `Iterable<T>`                   | `[]`             | Collection of items to render.                                                                                                                                                                               |
| `hasChildren`    | `Predicate<T> \| null`          | `null`           | Predicate that determines whether a node has children. Required when `children` returns an `Observable`.                                                                                                     |
| `idField`        | `string`                        | `""`             | Property holding a node's unique identifier. Required when `mode` is `"flat"`.                                                                                                                               |
| `mode`           | `DataStructure`                 | `"hierarchical"` | Shape of the source data: `"hierarchical"` for nested items via `children`, or `"flat"` for a flat list linked by `idField` and `parentIdField`.                                                             |
| `parentIdField`  | `string`                        | `""`             | Property holding a node's parent identifier. Required when `mode` is `"flat"`.                                                                                                                               |
| `textField`      | `string \| Selector<T, string>` | `""`             | Property name, or accessor, used to derive a node's display text. When empty, the data item itself is shown.                                                                                                 |

#### Outputs

| Name                | Type                        | Description                                                                                                                                           |
| ------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blur`              | `FocusEvent`                | Emitted when focus leaves the tree element.                                                                                                           |
| `childrenLoadError` | `ChildrenLoadErrorEvent<T>` | Emitted with the node and the error when lazily loaded children fail to load. The node is collapsed again and marked as failed; expanding it retries. |
| `focus`             | `FocusEvent`                | Emitted when focus enters the tree element (not the filter input).                                                                                    |
| `nodeClick`         | `NodeClickEvent<T>`         | Emitted when an enabled node is clicked, before the click selects it. Cancelable: `preventDefault()` skips the selection.                             |

#### Methods

| Name           | Signature                                                                                                                        | Description                                                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `moveNode`     | `(source: NodeItem<T>, target: NodeItem<T>, position: "before" \| "after" \| "inside" \| "outside") => NodeMoveSnapshot \| null` | Moves a node in the tree's internal structure. Returns a snapshot usable with `undoMoveNode`, or `null` when `position` is `"outside"` or either node isn't in the tree. |
| `undoMoveNode` | `(snapshot: NodeMoveSnapshot) => void`                                                                                           | Reverts a move previously performed by `moveNode`.                                                                                                                       |

---

### `TreeViewSelectableDirective<T, K = T>`

**Selector:** `mona-tree-view[monaTreeViewSelectable]` (exported as `monaTreeViewSelectable`)

#### Inputs

| Name                     | Type                                 | Default | Description                                                                                                                                                                                                            |
| ------------------------ | ------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `monaTreeViewSelectable` | `Partial<SelectableOptions> \| ""`   | `""`    | Selection mode, toggleability, and whether only nodes without children are selectable (property `options`). Merged over `{ childrenOnly: false, enabled: true, mode: "single", toggleable: false }` when applied bare. |
| `selectBy`               | `NodeKeySelector<T, K> \| undefined` | `""`    | Property name, or accessor, used to derive a node's selection key. Falls back to the node's data when unset.                                                                                                           |
| `selectedKeys`           | `Iterable<K>`                        | `[]`    | Keys of the selected nodes. Pair with `(selectedKeysChange)`, or bind `[(selectedKeys)]`.                                                                                                                              |

#### Outputs

| Name                 | Type                 | Description                                                                                                                            |
| -------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `nodeSelect`         | `NodeSelectEvent<T>` | Emitted before the user selects or deselects a node, by click or Enter. Cancelable; `selectionChange` follows when it isn't prevented. |
| `selectedKeysChange` | `Array<K>`           | Emitted with the selected keys when the user selects or deselects a node. Not emitted for keys set through `selectedKeys`.             |
| `selectionChange`    | `NodeItem<T>`        | Emitted with the node after the user selects or deselects it.                                                                          |

---

### `TreeViewCheckableDirective<T, K = T>`

**Selector:** `mona-tree-view[monaTreeViewCheckable]` (exported as `monaTreeViewCheckable`)

#### Inputs

| Name                    | Type                                          | Default | Description                                                                                                                                                                                                                                                       |
| ----------------------- | --------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checkBy`               | `NodeKeySelector<T, K> \| undefined`          | `""`    | Property name, or accessor, used to derive a node's check key. Falls back to the node's data when unset.                                                                                                                                                          |
| `checkedKeys`           | `Iterable<K>`                                 | `[]`    | Keys of the checked nodes. Pair with `(checkedKeysChange)`, or bind `[(checkedKeys)]`.                                                                                                                                                                            |
| `hasCheckbox`           | `((data: T, uid: string) => boolean) \| null` | `null`  | Predicate that determines whether a node displays a checkbox. Every node displays one when unset.                                                                                                                                                                 |
| `monaTreeViewCheckable` | `Partial<CheckableOptions> \| ""`             | `""`    | Check mode and whether checking a node also checks its children or parents (property `options`). Merged over `{ checkChildren: true, checkDisabledChildren: false, checkParents: true, childrenOnly: false, enabled: true, mode: "multiple" }` when applied bare. |

#### Outputs

| Name                | Type                | Description                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checkedKeysChange` | `Array<K>`          | Emitted with the checked keys when the user checks or unchecks a node, including the children and parents the check follows. Not emitted for keys set through `checkedKeys`, nor for keys the tree derives on its own (checked parents of checked children set from code, lazily loaded children of a checked node, ancestors after a drop); those are included in the next user change. |
| `nodeCheck`         | `NodeCheckEvent<T>` | Emitted before a node's checked state changes, by its checkbox or Space. Cancelable.                                                                                                                                                                                                                                                                                                     |

---

### `TreeViewDisableDirective<T, K = T>`

**Selector:** `mona-tree-view[monaTreeViewDisable]` (exported as `monaTreeViewDisable`)

#### Inputs

| Name                  | Type                                 | Default | Description                                                                                                                                         |
| --------------------- | ------------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `disableBy`           | `NodeKeySelector<T, K> \| undefined` | `""`    | Property name, or accessor, used to derive a node's disable key. Falls back to the node's data when unset.                                          |
| `disabledKeys`        | `Iterable<K>`                        | `[]`    | Keys of the disabled nodes.                                                                                                                         |
| `monaTreeViewDisable` | `Partial<DisableOptions> \| ""`      | `""`    | Whether disabling a node also disables its children (property `options`). Merged over `{ disableChildren: true, enabled: true }` when applied bare. |

No outputs.

---

### `TreeViewExpandableDirective<T, K = T>`

**Selector:** `mona-tree-view[monaTreeViewExpandable]` (exported as `monaTreeViewExpandable`)

#### Inputs

| Name                     | Type                                 | Default | Description                                                                                                                |
| ------------------------ | ------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `expandBy`               | `NodeKeySelector<T, K> \| undefined` | `""`    | Property name, or accessor, used to derive a node's expand key. Falls back to the node's data when unset.                  |
| `expandedKeys`           | `Iterable<K>`                        | `[]`    | Keys of the expanded nodes. Pair with `(expandedKeysChange)`, or bind `[(expandedKeys)]`.                                  |
| `monaTreeViewExpandable` | `Partial<ExpandableOptions> \| ""`   | `""`    | Whether expanding and collapsing nodes is enabled (property `options`). Merged over `{ enabled: true }` when applied bare. |

#### Outputs

| Name                 | Type          | Description                                                                                                                                                                                     |
| -------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `collapse`           | `NodeItem<T>` | Emitted when the user collapses a node.                                                                                                                                                         |
| `expand`             | `NodeItem<T>` | Emitted when the user expands a node.                                                                                                                                                           |
| `expandedKeysChange` | `Array<K>`    | Emitted with the expanded keys when the user expands or collapses a node. Not emitted for keys set through `expandedKeys`, nor while a filter is applied: the filter's expansion is view state. |

---

### `TreeViewFilterableDirective<T>`

**Selector:** `mona-tree-view[monaTreeViewFilterable]` (exported as `monaTreeViewFilterable`)

#### Inputs

| Name                     | Type                               | Default | Description                                                                                                                                                                                                  |
| ------------------------ | ---------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `filter`                 | `string`                           | `""`    | Current filter text used to narrow the visible nodes. A `model()` input: two-way bindable with `[(filter)]`; the user's typing updates it, and setting it from code (including back to `""`) always applies. |
| `filterPlaceholder`      | `string`                           | `""`    | Placeholder text shown in the tree's filter input.                                                                                                                                                           |
| `monaTreeViewFilterable` | `Partial<FilterableOptions> \| ""` | `""`    | Filter operator, case sensitivity, and debounce delay (property `options`). Merged over `{ enabled: true, operator: "contains", caseSensitive: false, debounce: 0 }` when applied bare.                      |

#### Outputs

| Name           | Type                | Description                                                                                                                          |
| -------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `filterChange` | `string`            | Emitted with the new filter text when the user's typing applies (the `filter` model's output).                                       |
| `filterInput`  | `FilterChangeEvent` | Emitted when the user types in the filter input, before the filter applies. Cancelable: `preventDefault()` keeps the current filter. |

---

### `TreeViewDragAndDropDirective<T>`

**Selector:** `mona-tree-view[monaTreeViewDragAndDrop]` (exported as `monaTreeViewDragAndDrop`)

#### Inputs

| Name                      | Type                              | Default | Description                                                                                                                            |
| ------------------------- | --------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `monaTreeViewDragAndDrop` | `Partial<DraggableOptions> \| ""` | `""`    | Whether dragging nodes to reorder or reparent them is enabled (property `options`). Merged over `{ enabled: true }` when applied bare. |

#### Outputs

| Name            | Type                    | Description                                                                                                                                                                         |
| --------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nodeDrag`      | `NodeDragEvent<T>`      | Emitted while a node is being dragged, with the node under the pointer. Not cancelable.                                                                                             |
| `nodeDragEnd`   | `NodeDragEndEvent<T>`   | Emitted when a node drag ends. Cancelable.                                                                                                                                          |
| `nodeDragStart` | `NodeDragStartEvent<T>` | Emitted when a node drag starts. Cancelable.                                                                                                                                        |
| `nodeDrop`      | `NodeDropEvent<T>`      | Emitted when a node is dropped before, after or inside another node. Cancelable. The tree doesn't move the node itself — see [Drag and drop reordering](#drag-and-drop-reordering). |

---

### `TreeViewNodeTemplateDirective<T = any>`

**Selector:** `ng-template[monaTreeViewNodeTemplate]`

#### Inputs

| Name                         | Type                               | Default | Description                                                                 |
| ---------------------------- | ---------------------------------- | ------- | --------------------------------------------------------------------------- |
| `monaTreeViewNodeTemplateOf` | `Iterable<T> \| null \| undefined` | `null`  | The tree view's data, used only to type the template's data item. Optional. |

---

### Exported Types

Everything below is exported from `@nanahoshi/mona-ui/tree-view`, except `FilterableOptions` and `FilterChangeEvent`, which are exported from `@nanahoshi/mona-ui/common`. The entry point also exports the `moveTreeNode` and `moveFlatTreeNode` helpers and `TREE_VIEW_DEFAULT_MESSAGES`.

#### Options

| Type                | Fields                                                                                                                                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SelectableOptions` | `enabled: boolean`; `childrenOnly: boolean` (only nodes without children are selectable); `mode: "single" \| "multiple"`; `toggleable?: boolean` (single mode only: clicking the selected node deselects it).                                        |
| `CheckableOptions`  | `checkChildren?: boolean`, `checkDisabledChildren?: boolean`, `checkParents?: boolean` (multiple mode only); `childrenOnly?: boolean` (only nodes without children have checkboxes); `enabled?: boolean`; `mode?: "multiple" \| "single"`.           |
| `DisableOptions`    | `disableChildren: boolean`; `enabled: boolean`.                                                                                                                                                                                                      |
| `ExpandableOptions` | `enabled: boolean`.                                                                                                                                                                                                                                  |
| `DraggableOptions`  | `enabled: boolean`.                                                                                                                                                                                                                                  |
| `FilterableOptions` | `caseSensitive: boolean`; `debounce: number` (milliseconds); `enabled: boolean`; `operator: "contains" \| "endsWith" \| "startsWith" \| ((value: string, filter: string) => boolean)` (a function receives lower-cased text unless `caseSensitive`). |

#### Selectors and data

| Type                             | Definition                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `ChildrenSelector<T>`            | `string \| Selector<T, Iterable<T> \| Observable<Iterable<T>>>`                                           |
| `NodeKeySelector<T, K>`          | `string \| Selector<T, K> \| null`                                                                        |
| `DataStructure`                  | `"flat" \| "hierarchical"` (the `mode` input's type)                                                      |
| `NodeItem<T>`                    | `{ data: T; hasChildren: boolean; uid: string }` — a node as the events and methods report it             |
| `NodeMoveSnapshot`               | `{ originalIndex: number; originalParentUid: string \| null; sourceNodeUid: string }`                     |
| `ITreeView<T>`                   | `moveNode(...)` and `undoMoveNode(...)`, as on `TreeViewComponent` (the type of `NodeDropEvent.treeView`) |
| `TreeViewNodeTemplateContext<T>` | `{ $implicit: T; element: HTMLElement }`                                                                  |

#### Events

The cancelable events have `preventDefault()`, `isDefaultPrevented()`, `originalEvent` and `type`.

| Type                         | Members                                                                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `NodeClickEvent<T>`          | `nodeItem`; `originalEvent: MouseEvent`. Cancelable.                                                                                          |
| `NodeSelectEvent<T>`         | `nodeItem`; `originalEvent: MouseEvent \| KeyboardEvent`. Cancelable.                                                                         |
| `NodeCheckEvent<T>`          | `nodeItem`; `originalEvent: MouseEvent \| KeyboardEvent`. Cancelable.                                                                         |
| `NodeDragEvent<T>`           | `nodeItem` (the dragged node); `targetNodeItem: NodeItem<T> \| null` (the node under the pointer); `originalEvent`; `type`. Not cancelable.   |
| `NodeDragStartEvent<T>`      | `nodeItem`; `originalEvent: MouseEvent \| TouchEvent`. Cancelable.                                                                            |
| `NodeDragEndEvent<T>`        | `nodeItem`; `originalEvent: MouseEvent \| TouchEvent`. Cancelable.                                                                            |
| `NodeDropEvent<T>`           | `sourceNode` (also `nodeItem`); `targetNode`; `position: "before" \| "after" \| "inside" \| "outside"`; `treeView: ITreeView<T>`. Cancelable. |
| `FilterChangeEvent`          | `filter: string`. Cancelable.                                                                                                                 |
| `ChildrenLoadErrorEvent<T>`  | `error: unknown`; `node: NodeItem<T>`.                                                                                                        |
| `DropPositionChangeEvent<T>` | `position`; `targetNode`. Exported, but not emitted by any public output.                                                                     |
