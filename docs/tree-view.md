# Mona UI Tree View

`<mona-tree-view>` (from `@nanahoshi/mona-ui/tree-view`) shows hierarchical data as a WAI-ARIA `tree`: nodes that open and close, with optional selection, checkboxes, filtering, lazy loading and drag and drop. Each feature is a directive you add to the element.

Pick the pattern that matches the data:

| Data                                                       | Use                                              | Role                       |
| ---------------------------------------------------------- | ------------------------------------------------ | -------------------------- |
| a hierarchy the user opens and closes                      | `<mona-tree-view>`                               | `tree` of `treeitem`s      |
| a flat collection that is only shown (or activated)        | `<mona-list-view>` ([guide](list-view.md))       | `list` of `listitem`s      |
| a flat collection the user selects from                    | `<mona-list-view>` with `monaListViewSelectable` | `listbox` of `option`s     |
| a flat collection the user reorders or moves between lists | `<mona-list-box>` ([guide](list-box.md))         | `listbox` with a `toolbar` |

---

## 1. Data

```typescript
import { Component } from "@angular/core";
import { TreeViewComponent, TreeViewExpandableDirective } from "@nanahoshi/mona-ui/tree-view";

interface FileNode {
    id: number;
    name: string;
    items?: FileNode[];
}

@Component({
    selector: "app-files",
    imports: [TreeViewComponent, TreeViewExpandableDirective],
    template: `
        <mona-tree-view
            ariaLabel="Project files"
            textField="name"
            children="items"
            [data]="files"
            monaTreeViewExpandable
            expandBy="id"></mona-tree-view>
    `
})
export class FilesComponent {
    protected readonly files: FileNode[] = [
        { id: 1, name: "src", items: [{ id: 2, name: "main.ts" }] },
        { id: 3, name: "README.md" }
    ];
}
```

- `data` takes any iterable. `textField` is the property (or a function) that gives a node's text.
- `mode="hierarchical"` (the default) reads children from `children`: a property name, a function returning the children, or a function returning an `Observable` of them (see Lazy Loading).
- `mode="flat"` builds the tree from a flat array: set `idField` and `parentIdField`.
- Without `monaTreeViewExpandable`, every node is shown open and there are no expand buttons. Add it to let the user open and close nodes.

---

## 2. Labelling

Name the tree with the `ariaLabel` input, or point `ariaLabelledBy` at a visible heading:

```html
<h2 id="files-heading">Project files</h2>
<mona-tree-view ariaLabelledBy="files-heading" textField="name" [data]="files"></mona-tree-view>
```

- These are inputs, not ARIA attributes. A plain `aria-label` attribute on `mona-tree-view` stays on the host element, which has no role, so it **doesn't name the tree**.
- In development, a tree with neither input logs a console warning ("A tree view needs an accessible name").
- The filter input is named "Filter {name}" from `ariaLabel`. With only `ariaLabelledBy`, it falls back to "Filter tree"; set `ariaLabel` as well if the filter should carry the tree's name.
- Each node is named by its own content (its text, or what the node template renders). The expand button and nested nodes aren't part of the name.

---

## 3. Keys and Identity

Each feature finds nodes by a key: `expandBy`, `selectBy`, `checkBy` and `disableBy`. Each is a property name or a function of the data item. Without one, the key is the data item itself.

```html
<mona-tree-view
    ariaLabel="Departments"
    textField="name"
    children="teams"
    [data]="departments()"
    monaTreeViewExpandable
    expandBy="id"
    [(expandedKeys)]="expanded"
    monaTreeViewSelectable
    selectBy="id"
    [(selectedKeys)]="selected"></mona-tree-view>
```

Use a stable scalar such as an id. Object keys only match the same object instance, so after a refetch every node would lose its state.

---

## 4. Expanding

- `[(expandedKeys)]` holds the keys of the open nodes. `(expand)` and `(collapse)` carry the `NodeItem` (`data`, `hasChildren`, `uid`) of the node the user opened or closed.
- `expandedKeysChange` fires only when the **user** opens or closes a node. Keys you set through `expandedKeys` aren't echoed back, and neither is the expansion a filter applies.
- `[monaTreeViewExpandable]="{ enabled: false }"` turns the feature off again.
- The `*` key opens every sibling of the active node.

---

## 5. Selection

```html
<mona-tree-view
    ariaLabel="Categories"
    textField="name"
    children="items"
    [data]="categories"
    [monaTreeViewSelectable]="{ mode: 'multiple' }"
    selectBy="id"
    [(selectedKeys)]="selected"
    (nodeSelect)="confirm($event)"></mona-tree-view>
```

- Options: `mode` (`"single"` by default, or `"multiple"`), `toggleable` (single mode: clicking the selected node deselects it; `false` by default) and `childrenOnly` (only leaf nodes can be selected).
- The user selects with a click or <kbd>Enter</kbd>. In multiple mode each click or <kbd>Enter</kbd> toggles one node.
- `(nodeSelect)` fires **before** the change with a `NodeSelectEvent`; call `preventDefault()` to keep the selection. Then `selectedKeysChange` fires with the new keys (when they changed) and `(selectionChange)` with the node's `NodeItem`.
- `selectedKeysChange` fires only for user changes. Keys you set from code aren't reported back.
- `(nodeClick)` fires before selection too; preventing it skips the selection.
- Without checkboxes, each node has `aria-selected`, and multiple mode gives the tree `aria-multiselectable="true"`.

---

## 6. Checkboxes

```html
<mona-tree-view
    ariaLabel="Permissions"
    textField="name"
    children="items"
    [data]="permissions"
    [monaTreeViewCheckable]="{ checkParents: true, checkChildren: true }"
    checkBy="id"
    [(checkedKeys)]="granted"></mona-tree-view>
```

- Options (defaults in brackets): `mode` (`"multiple"`, or `"single"`), `checkChildren` (`true`), `checkParents` (`true`), `checkDisabledChildren` (`false`) and `childrenOnly` (`false`, only leaf nodes get a checkbox). `hasCheckbox` (a `(data, uid) => boolean` function) leaves the checkbox off chosen nodes.
- A parent with some checked children shows a mixed state. Nodes report it as `aria-checked="mixed"`, otherwise `true` or `false`.
- **With checkboxes, nodes report `aria-checked` and no `aria-selected`**, and the tree isn't `aria-multiselectable`. You can still add `monaTreeViewSelectable`; the selection is shown but not announced, so let the checkboxes carry the meaning.
- The checkbox itself is hidden from assistive technology and isn't a Tab stop: the node is the control. <kbd>Space</kbd> or a click on the checkbox toggles it.
- `(nodeCheck)` fires before the change; `preventDefault()` keeps the state.
- `checkedKeysChange` reports the user's change, including the children and parents it checked. It doesn't report keys you set, or keys the tree derives on its own (checked parents of children you set from code, lazily loaded children of a checked node, ancestors after a drop). Those are included in the next user change.

---

## 7. Disabled Nodes

```html
<mona-tree-view
    ariaLabel="Settings"
    textField="name"
    children="items"
    [data]="settings"
    monaTreeViewDisable
    disableBy="id"
    [disabledKeys]="[4, 7]"></mona-tree-view>
```

Disabled nodes have `aria-disabled="true"`. They can still receive focus, but can't be clicked, selected, checked, expanded or dragged. `disableChildren` (`true` by default) disables their descendants too.

---

## 8. Filtering

```html
<mona-tree-view
    ariaLabel="Project files"
    textField="name"
    children="items"
    [data]="files"
    monaTreeViewExpandable
    expandBy="id"
    [monaTreeViewFilterable]="{ operator: 'contains', debounce: 200 }"
    filterPlaceholder="Search files"
    [(filter)]="search"
    (filterInput)="onFilterInput($event)"></mona-tree-view>
```

- The filter box sits above the tree in a `search` landmark. It is named "Filter {tree name}", has `aria-controls` pointing at the tree, and doesn't take focus when the tree renders.
- Options: `operator` (`"contains"` by default, `"startsWith"`, `"endsWith"` or a `(text, filter) => boolean` function), `caseSensitive` (`false`), `debounce` in milliseconds (`0`) and `enabled`.
- `filter` is a two-way model. The user's typing updates it, and setting it from code (including back to `""`) applies.
- `(filterInput)` fires when the user types, before the filter applies. Call `preventDefault()` on its `FilterChangeEvent` to keep the current filter.
- The tree shows the matching nodes and their ancestors. Descendants of a match that don't match themselves are hidden. Only loaded nodes are searched.
- **The filter's expansion is view state.** While filtering, every node with visible children is open, and the user can open and close nodes. None of that reaches `expandedKeys` or `expandedKeysChange`. Clearing the filter restores the user's own expansion.
- After the user types, the result is announced politely: "3 results", or "No matching items". Filters you set from code aren't announced.
- A tree with no matches shows "No matching items" (an empty tree shows "No data"). The tree stays a named Tab stop, described by that text.

---

## 9. Lazy Loading

Return an `Observable` from `children` to load a node's children when the user first opens it. `hasChildren` tells the tree which nodes have children before they load:

```typescript
import { Component, inject, signal } from "@angular/core";
import {
    type ChildrenLoadErrorEvent,
    TreeViewComponent,
    TreeViewExpandableDirective
} from "@nanahoshi/mona-ui/tree-view";
import type { Observable } from "rxjs";

@Component({
    selector: "app-folders",
    imports: [TreeViewComponent, TreeViewExpandableDirective],
    template: `
        <mona-tree-view
            ariaLabel="Folders"
            textField="name"
            [data]="roots()"
            [children]="loadChildren"
            [hasChildren]="hasChildren"
            monaTreeViewExpandable
            expandBy="id"
            (childrenLoadError)="onLoadError($event)"></mona-tree-view>
    `
})
export class FoldersComponent {
    readonly #api = inject(FolderApi);
    protected readonly roots = signal<Folder[]>([]);
    protected readonly hasChildren = (folder: Folder): boolean => folder.childCount > 0;
    protected readonly loadChildren = (folder: Folder): Observable<Folder[]> => this.#api.children(folder.id);

    protected onLoadError(event: ChildrenLoadErrorEvent<Folder>): void {
        console.error(`Couldn't load ${event.node.data.name}`, event.error);
    }
}
```

- The tree takes the first value the Observable emits, and caches it. Opening the node again doesn't reload it.
- `monaTreeViewExpandable` is required: without it, no node can be opened, so nothing loads.
- **While loading**, the node reads as expanded and has `aria-busy="true"`. Its expand button shows a spinner and reads "Loading {node}". A load still running after 400 ms is announced politely ("Loading {node}"); a quicker one just shows its children.
- **On error**, the node closes again, `(childrenLoadError)` fires with a `ChildrenLoadErrorEvent` (`error`, `node`), and "Couldn't load the items in {node}" is announced and set as the node's description. The expand button shows an alert icon and reads "Retry loading {node}". **Opening the node again retries the load.** The collapse isn't reported through `expandedKeysChange`.
- A key in `expandedKeys` doesn't start a load by itself. When a node's children arrive, those of them whose keys are in `expandedKeys` load right away, so a saved expansion opens level by level.

---

## 10. Drag and Drop

`monaTreeViewDragAndDrop` lets the user drag nodes with a pointer to reorder or re-parent them. The tree doesn't change your data: in `(nodeDrop)`, move the node with `event.treeView.moveNode(event.sourceNode, event.targetNode, event.position)`, or update `data` with `moveTreeNode(data, event, "id", "items")` (hierarchical) or `moveFlatTreeNode` (flat). `(nodeDragStart)` and `(nodeDragEnd)` can be cancelled. There is no keyboard alternative, so offer another way to move nodes (a "Move to…" command, for example) where moving matters.

---

## 11. Node Template

```html
<mona-tree-view ariaLabel="Project files" textField="name" children="items" [data]="files">
    <ng-template monaTreeViewNodeTemplate [monaTreeViewNodeTemplateOf]="files" let-file>
        <svg lucideFile [size]="16" aria-hidden="true"></svg>
        <span>{{ file.name }}</span>
    </ng-template>
</mona-tree-view>
```

- `let-file` is the data item, and `let-element="element"` the node's element. Bind `monaTreeViewNodeTemplateOf` to the tree's data to type the data item; without it, it is `any`.
- The template's content is the node's accessible name. Hide decorative icons with `aria-hidden="true"`.
- The tree handles keys itself, so avoid interactive controls inside a node.

---

## 12. Keyboard

The tree is one Tab stop. The active node is conveyed with `aria-activedescendant` and has a 2px focus ring. When the tree gets focus, the last active node becomes active again (the first node the first time).

| Key                              | Action                                                                    |
| -------------------------------- | ------------------------------------------------------------------------- |
| <kbd>↓</kbd> / <kbd>↑</kbd>      | next / previous visible node; wraps around at the ends                    |
| <kbd>→</kbd>                     | closed node: open it; open node: move to its first child                  |
| <kbd>←</kbd>                     | open node: close it; otherwise move to the parent                         |
| <kbd>Home</kbd> / <kbd>End</kbd> | first / last visible node                                                 |
| <kbd>Enter</kbd>                 | select or deselect the node (with `monaTreeViewSelectable`)               |
| <kbd>Space</kbd>                 | check or uncheck the node (with `monaTreeViewCheckable`)                  |
| <kbd>*</kbd>                     | open every sibling of the node                                            |
| letters                          | type ahead to the next visible node whose text starts with the typed text |

- In right-to-left layouts <kbd>→</kbd> and <kbd>←</kbd> swap: <kbd>←</kbd> opens and moves to the first child, <kbd>→</kbd> closes and moves to the parent. The closed-node chevron is mirrored too.
- Disabled nodes can be reached, but the keys don't open, close, select or check them.
- When the active node is hidden by a collapse or a filter, its nearest visible ancestor (else the first visible node) becomes active, so `aria-activedescendant` never points at a missing node.

---

## 13. Localization

The labels come from the `treeView` message namespace. Override them through i18n (see the [i18n guide](i18n.md)):

```typescript
provideMonaI18n({
    messages: {
        treeView: { noData: "No files yet", filterLabel: (tree: string) => `Search ${tree}` }
    }
});
```

| Key                           | Used for                                                          |
| ----------------------------- | ----------------------------------------------------------------- |
| `expand`, `collapse`          | the expand button ("Expand src", "Collapse src")                  |
| `filterLabel(tree)`           | the filter input and its search landmark, from `ariaLabel`        |
| `filterTree`                  | the filter input when the tree has no `ariaLabel`                 |
| `results(count)`, `noMatches` | the filter announcement; `noMatches` also under an unmatched tree |
| `noData`                      | the text under an empty tree                                      |
| `loadingNode(node)`           | the expand button while loading, and the loading announcement     |
| `loadError(node)`             | the failure announcement and the node's description               |
| `retryLoading(node)`          | the expand button after a failed load                             |

`filter` is deprecated and no longer rendered. The full list is in `TREE_VIEW_DEFAULT_MESSAGES`, exported from `@nanahoshi/mona-ui/tree-view`.

---

## 14. Not Supported

- **Virtualization.** Every visible node is rendered. For very large trees, load levels lazily and keep the initial expansion small.
- **Range selection.** <kbd>Shift</kbd>+arrow and <kbd>Shift</kbd>+click don't select ranges, and there is no select-all shortcut; in multiple mode each node is toggled on its own.
- **Keyboard drag and drop.** Dragging needs a pointer (see Drag and Drop).
- **An expand-all API.** Set `expandedKeys` to the keys you want open (for loaded nodes), or use <kbd>*</kbd> on a level.
