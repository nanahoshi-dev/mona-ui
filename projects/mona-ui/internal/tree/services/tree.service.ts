import { computed, DestroyRef, effect, inject, Injectable, signal, TemplateRef, untracked } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import {
    EnumerableSet,
    forEach,
    from,
    IEnumerable,
    ImmutableDictionary,
    ImmutableSet,
    List,
    Predicate,
    Selector,
    sequenceEqual
} from "@mirei/ts-collections";
import { FilterableOptions, FilterChangeEvent } from "@nanahoshi/mona-ui/common";
import {
    BehaviorSubject,
    debounceTime,
    distinctUntilChanged,
    Observable,
    ReplaySubject,
    Subject,
    Subscription,
    switchMap,
    take
} from "rxjs";
import { CheckableOptions } from "../models/CheckableOptions";
import { DataStructure } from "../models/DataStructure";
import { DisableOptions } from "../models/DisableOptions";
import { DraggableOptions } from "../models/DraggableOptions";
import { DropPosition, DropPositionChangeEvent } from "../models/DropPositionChangeEvent";
import { ExpandableOptions } from "../models/ExpandableOptions";
import { NodeCheckEvent } from "../models/NodeCheckEvent";
import { NodeClickEvent } from "../models/NodeClickEvent";
import { NodeDragEndEvent } from "../models/NodeDragEndEvent";
import { InternalNodeDragEvent } from "../models/NodeDragEvent";
import { NodeDragStartEvent } from "../models/NodeDragStartEvent";
import { NodeDropEventSansTree } from "../models/NodeDropEvent";
import { NodeItem } from "../models/NodeItem";
import { NodeSelectEvent } from "../models/NodeSelectEvent";
import { SelectableOptions } from "../models/SelectableOptions";
import { TreeNode } from "../models/TreeNode";
import { TreeNodeCheckEvent } from "../models/TreeNodeCheckEvent";
import { TreeNodeExpandEvent } from "../models/TreeNodeExpandEvent";
import { TreeNodeSelectEvent } from "../models/TreeNodeSelectEvent";
import { ChildrenSelector, NodeKeySelector } from "../models/TreeSelectors";
import { getTreeNodeElementId } from "../utils/getTreeNodeElementId";

@Injectable()
export class TreeService<T> {
    readonly #checkedKeys = signal(ImmutableSet.create<any>());
    /**
     * Pending asynchronous child loads by node uid, so a new load for a node cancels the previous one.
     */
    readonly #childLoads = new Map<string, Subscription>();
    readonly #data = signal(ImmutableSet.create<T>());
    readonly #filteredExpandedKeys = signal(ImmutableSet.create<any>());
    readonly #flatIdField = signal("");
    readonly #flatParentIdField = signal("");
    readonly #hasCheckboxPredicate = signal<((data: T, uid: string) => boolean) | null>(null);
    readonly #hasChildrenPredicate = signal<Predicate<any> | null>(null);
    readonly #navigableNodes = computed(() => {
        const visibleUids = this.#visibleUids();
        const allFlatNodes = TreeService.flatten(this.nodeSet());
        // flatten() walks the tree depth-first, so its order already is the visual (navigation) order.
        if (visibleUids === null) {
            return allFlatNodes.where(n => n.parent === null || !this.isAnyParentCollapsed(n)).toImmutableSet();
        }
        return allFlatNodes
            .where(n => visibleUids.has(n.uid) && (n.parent === null || !this.isAnyParentCollapsed(n)))
            .toImmutableSet();
    });
    readonly #nodeDictionary = computed(() => {
        const nodes = this.nodeSet();
        return this.createNodeDictionary(nodes);
    });
    readonly #structure = signal<DataStructure>("hierarchical");
    readonly #unfilteredExpandedKeys = signal(ImmutableSet.create<any>());
    readonly #visibleUids = computed<Set<string> | null>(() => {
        const filterText = this.filterText();
        if (!filterText) {
            return null;
        }
        // Tracked on purpose: moves, lazily loaded children and filter option changes re-run the filter.
        return this.computeVisibleUids(this.nodeSet(), filterText);
    });
    public readonly animationTemporarilyDisabled = signal(false);
    public readonly animationEnabled = signal(true);
    public readonly blur$ = new Subject<FocusEvent>();
    public readonly checkBy = signal<NodeKeySelector<T>>(null);
    public readonly checkableOptions = signal<CheckableOptions>({
        checkChildren: true,
        checkDisabledChildren: false,
        checkParents: true,
        childrenOnly: false,
        enabled: false,
        mode: "multiple"
    });
    public readonly checkedKeys$ = toObservable(this.#checkedKeys);
    public readonly children = signal<ChildrenSelector<T>>("");
    public readonly disableBy = signal<NodeKeySelector<T>>(null);
    public readonly disableOptions = signal<DisableOptions>({
        disableChildren: true,
        enabled: false
    });
    public readonly disabledKeys = signal(ImmutableSet.create<any>());
    public readonly draggableOptions = signal<DraggableOptions>({ enabled: false });
    public readonly dragging = signal(false);
    public readonly dragging$ = toObservable(this.dragging);
    public readonly dropAllowed = signal(false);
    public readonly dropPositionChange$ = new BehaviorSubject<DropPositionChangeEvent<T> | null>(null);
    public readonly dropPositionSignal = toSignal(this.dropPositionChange$, { initialValue: null });
    public readonly expandBy = signal<NodeKeySelector<T>>(null);
    public readonly expandableOptions = signal<ExpandableOptions>({ enabled: false });
    public readonly expandedKeys = computed(() => {
        const filterText = this.filterText();
        if (filterText) {
            return this.#filteredExpandedKeys();
        }
        return this.#unfilteredExpandedKeys();
    });
    public readonly expandedKeys$ = toObservable(this.expandedKeys);
    public readonly filterableOptions = signal<FilterableOptions>({
        enabled: false,
        debounce: 0,
        caseSensitive: false,
        operator: "contains"
    });
    public readonly filter$ = new ReplaySubject<string>(1);
    public readonly filterChange$ = new Subject<FilterChangeEvent>();
    public readonly filterPlaceholder = signal("");
    public readonly filterText = toSignal(
        toObservable(this.filterableOptions).pipe(
            switchMap(opts => this.filter$.pipe(debounceTime(opts.debounce), distinctUntilChanged()))
        ),
        { initialValue: "" }
    );
    public readonly focus$ = new Subject<FocusEvent>();
    public readonly navigatedNode = signal<TreeNode<T> | null>(null);
    public readonly nodeCheck$ = new Subject<NodeCheckEvent<T>>();
    public readonly nodeCheckChange$ = new Subject<TreeNodeCheckEvent<T>>();
    public readonly nodeClick$ = new Subject<NodeClickEvent<T>>();
    public readonly nodeDrag$ = new Subject<InternalNodeDragEvent<T>>();
    public readonly nodeDragEnd$ = new Subject<NodeDragEndEvent<T>>();
    public readonly nodeDragStart$ = new Subject<NodeDragStartEvent<T>>();
    public readonly nodeDrop$ = new Subject<NodeDropEventSansTree<T>>();
    public readonly nodeExpand$ = new Subject<TreeNodeExpandEvent<T>>();
    public readonly nodeSelect$ = new Subject<NodeSelectEvent<T>>();
    public readonly nodeSelectChange$ = new Subject<TreeNodeSelectEvent<T>>();
    public readonly nodeSet = signal(ImmutableSet.create<TreeNode<T>>());
    public readonly nodeTemplate = signal<TemplateRef<any> | null>(null);
    public readonly selectBy = signal<NodeKeySelector<T>>(null);
    public readonly selectableOptions = signal<SelectableOptions>({
        childrenOnly: false,
        enabled: false,
        mode: "single",
        toggleable: false
    });
    public readonly selectedKeys = signal(ImmutableSet.create<any>());
    public readonly selectedKeys$ = toObservable(this.selectedKeys);
    public readonly selectedNodes = computed(() => {
        const selectedKeys = this.selectedKeys();
        const nodeDictionary = this.#nodeDictionary();
        return selectedKeys
            .select(k => {
                return nodeDictionary.values().firstOrDefault(n => {
                    const key = this.getSelectKey(n);
                    return key === k;
                });
            })
            .where(n => n != null)
            .cast<TreeNode<T>>()
            .toImmutableSet();
    });
    public readonly selectionChange$ = new Subject<NodeItem<T>>();
    public readonly textField = signal<string | Selector<T, string>>("");
    public readonly viewNodeSet = computed(() => {
        const visibleUids = this.#visibleUids();
        if (visibleUids === null) {
            return this.nodeSet();
        }
        return this.nodeSet()
            .where(n => visibleUids.has(n.uid))
            .toImmutableSet();
    });

    public constructor() {
        inject(DestroyRef).onDestroy(() => {
            this.#childLoads.forEach(subscription => subscription.unsubscribe());
            this.#childLoads.clear();
        });
        effect(() => {
            const visibleUids = this.#visibleUids();
            untracked(() => {
                if (visibleUids === null) {
                    return;
                }
                const expandedKeys = TreeService.flatten(this.nodeSet())
                    .where(n => visibleUids.has(n.uid) && !n.children().isEmpty())
                    .select(n => this.getExpandKey(n))
                    .toImmutableSet();
                this.#filteredExpandedKeys.set(expandedKeys);
            });
        });
    }

    public static flatten<T>(nodes: Iterable<TreeNode<T>>): List<TreeNode<T>> {
        const flattenedNodes = new List<TreeNode<T>>();
        for (const node of nodes) {
            flattenedNodes.add(node);
            if (!node.children().isEmpty()) {
                flattenedNodes.addAll(TreeService.flatten(node.children()));
            }
        }
        return flattenedNodes;
    }

    public clearFilter(): void {
        this.filter$.next("");
    }

    public detachNode(node: TreeNode<T>): void {
        if (node.parent) {
            node.parent.children.update(list => {
                const parent = node.parent as TreeNode<T>;
                return list.clear().addAll(parent.children().where(n => n !== node));
            });
            node.parent = null;
        } else {
            this.nodeSet.update(nodes => nodes.remove(node));
        }
        this.updateNodeIndices();
    }

    /**
     * Expands every expandable, enabled sibling of a node (the `*` key of the WAI-ARIA tree pattern).
     */
    public expandSiblings(node: TreeNode<T>): void {
        const siblings = node.parent ? node.parent.children() : this.nodeSet();
        for (const sibling of siblings) {
            if (this.hasChildren(sibling)) {
                this.toggleNodeExpand(sibling, true);
            }
        }
    }

    /**
     * Finds the next visible node, after the navigated node and wrapping around, whose text starts with `prefix`
     * (case-insensitive). Used for typeahead.
     */
    public findNodeByText(prefix: string): TreeNode<T> | null {
        const normalizedPrefix = prefix.toLowerCase();
        const nodes = this.#navigableNodes().toArray();
        const navigatedNode = this.navigatedNode();
        const start = navigatedNode ? nodes.indexOf(navigatedNode) : -1;
        for (let offset = 1; offset <= nodes.length; offset++) {
            const node = nodes[(start + offset) % nodes.length];
            if (this.getNodeText(node).toLowerCase().startsWith(normalizedPrefix)) {
                return node;
            }
        }
        return null;
    }

    public getNodeByUid(uid: string): TreeNode<T> | null {
        const nodeDictionary = this.#nodeDictionary();
        return nodeDictionary.get(uid) ?? null;
    }

    public getNodeElementId(uid: string): string {
        return getTreeNodeElementId(uid);
    }

    public getNodeText(node: TreeNode<T>): string {
        const textField = this.textField();
        let text: unknown;
        if (!textField) {
            text = node.data;
        } else if (typeof textField === "string") {
            text = (node.data as Record<string, unknown> | null)?.[textField];
        } else {
            text = textField(node.data);
        }
        return text == null ? "" : String(text);
    }

    public hasChildren(node: TreeNode<T> | null): boolean {
        if (node === null) {
            return false;
        }
        const hasChildrenPredicate = this.#hasChildrenPredicate();
        if (hasChildrenPredicate) {
            return hasChildrenPredicate(node.data);
        }
        return !node.children().isEmpty();
    }

    public insertNodeAtIndex(node: TreeNode<T>, parentUid: string | null, index: number): void {
        if (parentUid !== null) {
            const parent = this.getNodeByUid(parentUid);
            if (!parent || node.isDescendantOf(parent)) {
                return;
            }
            parent.children.update(set => {
                const tempList = set.toList();
                tempList.addAt(node, index);
                return tempList.toImmutableSet();
            });
            node.parent = parent;
        } else {
            this.nodeSet.update(nodes => {
                const tempList = nodes.toList();
                tempList.addAt(node, index);
                return tempList.toImmutableSet();
            });
            node.parent = null;
        }
        this.updateNodeIndices();
    }

    public isCheckable(node: TreeNode<T>): boolean {
        const checkableOptions = this.checkableOptions();
        if (!checkableOptions.enabled) {
            return false;
        }
        const hasCheckbox = this.#hasCheckboxPredicate();
        if (hasCheckbox !== null && !hasCheckbox(node.data, node.uid)) {
            return false;
        }
        return !(checkableOptions.childrenOnly && !node.children().isEmpty());
    }

    public isChecked(node: TreeNode<T>): boolean {
        return node.checked();
    }

    public isDisabled(node: TreeNode<T>): boolean {
        const disableOptions = this.disableOptions();
        if (!disableOptions.enabled) {
            return false;
        }
        const disabledKeys = this.disabledKeys();
        if (disabledKeys.contains(this.getDisableKey(node))) {
            return true;
        }
        if (!disableOptions.disableChildren) {
            return false;
        }
        // A single walk up the ancestors: O(depth) instead of re-evaluating every ancestor's own ancestors.
        for (let parent = node.parent; parent != null; parent = parent.parent) {
            if (disabledKeys.contains(this.getDisableKey(parent))) {
                return true;
            }
        }
        return false;
    }

    public isExpanded(node: TreeNode<T>): boolean {
        const expandableOptions = this.expandableOptions();
        const expandedKeys = this.expandedKeys();
        if (!expandableOptions.enabled) {
            return true;
        }
        if (node.children().isEmpty()) {
            return false;
        }
        const key = this.getExpandKey(node);
        return expandedKeys.contains(key);
    }

    public isIndeterminate(node: TreeNode<T>): boolean {
        const checkableOptions = this.checkableOptions();
        if (!checkableOptions.enabled || !checkableOptions.checkParents || checkableOptions.mode === "single") {
            return false;
        }
        if (node.children().isEmpty()) {
            return false;
        }
        const childNodes = this.getCheckStateChildren(node);
        if (childNodes.none()) {
            return false;
        }
        const checkedCount = childNodes.where(n => this.isChecked(n)).count();
        const indeterminateCount = childNodes.where(n => this.isIndeterminate(n)).count();
        const childCount = childNodes.count();
        return (checkedCount > 0 && checkedCount < childCount) || indeterminateCount > 0;
    }

    public isNavigated(node: TreeNode<T>): boolean {
        const navigatedNode = this.navigatedNode();
        return navigatedNode === node;
    }

    public isSelected(node: TreeNode<T>): boolean {
        const selectableOptions = this.selectableOptions();
        const selectedKeys = this.selectedKeys();
        if (!selectableOptions.enabled) {
            return false;
        }
        const key = this.getSelectKey(node);
        return selectedKeys.contains(key);
    }

    public isTreeFiltered(): boolean {
        return this.filterText() !== "";
    }

    public isVisible(node: TreeNode<T>): boolean {
        const visibleUids = this.#visibleUids();
        if (visibleUids === null) {
            return true;
        }
        return visibleUids.has(node.uid);
    }

    /**
     * Loads the children of a node from an asynchronous children selector.
     * Children are loaded once and cached; pass `reload` to request them again. A new load cancels a pending one.
     */
    public loadNodeChildren(node: TreeNode<T>, reload: boolean = false): void {
        const childrenSelector = this.children();
        if (typeof childrenSelector !== "function") {
            return;
        }
        if (!reload && (node.childrenLoaded || node.loading())) {
            return;
        }
        const children = childrenSelector(node.data);
        if (!(children instanceof Observable)) {
            return;
        }
        this.#childLoads.get(node.uid)?.unsubscribe();
        node.loading.set(true);
        const subscription = children.pipe(take(1)).subscribe({
            next: c => {
                const childNodes = new List<TreeNode<T>>();
                for (const child of c) {
                    const childNode = new TreeNode(child);
                    childNode.parent = node;
                    childNodes.add(childNode);
                }
                this.loadCheckedKeysForChildren(node, childNodes);
                node.children.update(list => list.clear().addAll(childNodes));
                this.updateNodeIndices();
                node.childrenLoaded = true;
                node.loading.set(false);
                this.#childLoads.delete(node.uid);
                this.restoreExpandedChildren(childNodes);
            },
            error: () => {
                node.loading.set(false);
                this.#childLoads.delete(node.uid);
            },
            complete: () => {
                if (node.loading()) {
                    node.loading.set(false);
                }
                this.#childLoads.delete(node.uid);
            }
        });
        if (node.loading()) {
            this.#childLoads.set(node.uid, subscription);
        }
    }

    /**
     * Moves a node relative to a target node. Moving a node onto itself or into its own subtree is ignored,
     * because it would detach the subtree and create a parent cycle.
     */
    public moveNode(sourceNode: TreeNode<T>, targetNode: TreeNode<T>, position: DropPosition): void {
        if (sourceNode === targetNode || targetNode.isDescendantOf(sourceNode)) {
            return;
        }
        const oldParent = sourceNode.parent;
        switch (position) {
            case "inside":
                this.moveNodeInside(sourceNode, targetNode);
                break;
            case "before":
                this.moveNodeBefore(sourceNode, targetNode);
                break;
            case "after":
                this.moveNodeAfter(sourceNode, targetNode);
                break;
        }
        this.updateNodeIndices();
        this.recalculateCheckedAncestors(oldParent, sourceNode.parent);
    }

    public navigate(direction: "next" | "previous" | "first" | "last"): TreeNode<T> | null {
        const navigableNodes = this.#navigableNodes();
        const navigatedNode = this.navigatedNode();
        if (navigableNodes.isEmpty()) {
            return null;
        }
        if (direction === "first") {
            const first = navigableNodes.first();
            this.navigatedNode.set(first);
            return first;
        }
        if (direction === "last") {
            const last = navigableNodes.last();
            this.navigatedNode.set(last);
            return last;
        }
        const firstNode = navigableNodes.first();
        if (navigatedNode === null) {
            this.navigatedNode.set(firstNode);
            return firstNode;
        }
        if (direction === "next") {
            return this.navigateToNextNode();
        }
        if (direction === "previous") {
            return this.navigateToPreviousNode();
        }
        return null;
    }

    public notifySelectionChange(node: TreeNode<T>): void {
        this.selectionChange$.next(node.nodeItem);
    }

    public setAnimationEnabled(enabled: boolean): void {
        this.animationEnabled.set(enabled);
    }

    public setChildrenSelector(selector: string | Selector<T, Iterable<T> | Observable<Iterable<T>>>): void {
        if (this.children() === selector) {
            return;
        }
        this.children.set(selector);
        this.nodeSet.set(this.createNodes(this.#data()));
        this.updateNodeIndices();
    }

    public setCheckBy(selector: NodeKeySelector<T>): void {
        this.checkBy.set(selector);
    }

    public setCheckableOptions(options: Partial<CheckableOptions>): void {
        this.checkableOptions.update(o => ({ ...o, ...options }));
    }

    public setCheckedKeys(keys: Iterable<any>): void {
        const checkedKeys = this.#checkedKeys().orderBy(k => k);
        const orderedKeys = from(keys).orderBy(k => k);
        if (sequenceEqual(checkedKeys, orderedKeys)) {
            return;
        }
        const keyList = Array.from(keys);
        const keySet = new Set<unknown>(keyList);
        this.#nodeDictionary().forEach(n => {
            n.value.checked.set(keySet.has(this.getCheckKey(n.value)));
        });
        this.#checkedKeys.set(ImmutableSet.create(keyList));
        this.applyCheckedKeysToNodes();
    }

    public setData(data: Iterable<T>): void {
        this.#data.set(ImmutableSet.create(data));
        this.nodeSet.set(this.createNodes(data));
        this.updateNodeIndices();
        this.applyCheckedKeysToNodes();
        const navigatedNode = this.navigatedNode();
        if (navigatedNode && this.#nodeDictionary().get(navigatedNode.uid) == null) {
            // The node was removed: drop it so aria-activedescendant never points at a missing element.
            this.navigatedNode.set(null);
        }
    }

    public setDataStructure(structure: DataStructure): void {
        this.#structure.set(structure);
    }

    public setDisableBy(selector: NodeKeySelector<T>): void {
        this.disableBy.set(selector);
    }

    public setDisableOptions(options: Partial<DisableOptions>): void {
        this.disableOptions.update(o => ({ ...o, ...options }));
    }

    public setDisabledKeys(keys: Iterable<any>): void {
        const disabledKeys = this.disabledKeys().orderBy(k => k);
        const orderedKeys = from(keys).orderBy(k => k);
        if (sequenceEqual(disabledKeys, orderedKeys)) {
            return;
        }
        this.disabledKeys.set(ImmutableSet.create(keys));
    }

    public setDraggableOptions(options: Partial<DraggableOptions>): void {
        this.draggableOptions.update(o => ({ ...o, ...options }));
    }

    public setExpandBy(selector: NodeKeySelector<T>): void {
        this.expandBy.set(selector);
    }

    public setExpandableOptions(options: Partial<ExpandableOptions>): void {
        this.expandableOptions.update(o => ({ ...o, ...options }));
    }

    public setExpandedKeys(keys: Iterable<any>): void {
        const unfilteredKeys = this.#unfilteredExpandedKeys().orderBy(k => k);
        const orderedKeys = from(keys).orderBy(k => k);
        if (sequenceEqual(unfilteredKeys, orderedKeys)) {
            return;
        }
        this.#unfilteredExpandedKeys.set(ImmutableSet.create(keys));
    }

    public setFilterableOptions(options: Partial<FilterableOptions>): void {
        this.filterableOptions.update(o => ({ ...o, ...options }));
    }

    public setFlatIdField(field: string): void {
        this.#flatIdField.set(field);
    }

    public setFlatParentIdField(field: string): void {
        this.#flatParentIdField.set(field);
    }

    public setHasCheckboxPredicate(fn: ((data: T, uid: string) => boolean) | null): void {
        this.#hasCheckboxPredicate.set(fn);
    }

    public setHasChildrenPredicate(predicate: Predicate<any> | null): void {
        this.#hasChildrenPredicate.set(predicate);
    }

    public setNodeCheck(node: TreeNode<T>, checked: boolean): void {
        const checkableOptions = this.checkableOptions();
        if (!checkableOptions.enabled) {
            return;
        }
        const checkParents = checkableOptions.checkParents;
        const checkChildren = checkableOptions.checkChildren;
        const childrenOnly = checkableOptions.childrenOnly;
        const checkDisabledChildren = checkableOptions.checkDisabledChildren;
        const mode = checkableOptions.mode;
        const key = this.getCheckKey(node);

        const checkedKeys = this.#checkedKeys().toEnumerableSet();
        const nodeDictionary = this.#nodeDictionary();

        if (mode === "single") {
            nodeDictionary
                .values()
                .where(n => n !== node)
                .forEach(n => n.checked.set(false));
            checkedKeys.clear();
            if (checked) {
                checkedKeys.add(key);
            }
        } else if (checked) {
            checkedKeys.add(key);
        } else {
            checkedKeys.remove(key);
        }
        node.checked.set(checked);

        if (mode !== "single" && checkChildren) {
            const hasCheckbox = this.#hasCheckboxPredicate();
            const childNodes = this.getChildNodes(node);
            childNodes.forEach(n => {
                if (hasCheckbox !== null && !hasCheckbox(n.data, n.uid)) {
                    return;
                }
                if (checkDisabledChildren || !this.isDisabled(n)) {
                    const childKey = this.getCheckKey(n);
                    if (checked) {
                        checkedKeys.add(childKey);
                    } else {
                        checkedKeys.remove(childKey);
                    }
                    n.checked.set(checked);
                }
            });
        }
        if (mode !== "single" && checkParents && !childrenOnly) {
            const parentNodes = this.getParentNodes(node);
            parentNodes.forEach(n => {
                const allChecked = this.deriveParentChecked(n);
                if (allChecked === null) {
                    return;
                }
                const parentKey = this.getCheckKey(n);
                if (allChecked) {
                    checkedKeys.add(parentKey);
                } else {
                    checkedKeys.remove(parentKey);
                }
                n.checked.set(allChecked);
            });
        }
        this.#checkedKeys.set(checkedKeys.toImmutableSet());
    }

    public setNodeExpand(node: TreeNode<T>, expanded: boolean): void {
        const key = this.getExpandKey(node);
        const expandedKeysSignal = this.isTreeFiltered() ? this.#filteredExpandedKeys : this.#unfilteredExpandedKeys;
        expandedKeysSignal.update(keys => {
            if (expanded) {
                return keys.add(key);
            }
            return keys.remove(key);
        });
        this.navigatedNode.set(node);
    }

    public setNodeSelect(node: TreeNode<T>, selected: boolean): void {
        const selectableOptions = this.selectableOptions();
        if (!selectableOptions.enabled) {
            return;
        }
        const childrenOnly = selectableOptions.childrenOnly;
        if (childrenOnly && this.hasChildren(node)) {
            return;
        }
        const key = this.getSelectKey(node);
        const mode = selectableOptions.mode;
        this.selectedKeys.update(keys => {
            if (mode === "single") {
                const toggleable = selectableOptions.toggleable;
                if (toggleable && keys.contains(key)) {
                    return keys.remove(key);
                } else {
                    return keys.clear().add(key);
                }
            }
            if (selected) {
                return keys.add(key);
            }
            return keys.remove(key);
        });
        this.navigatedNode.set(node);
    }

    public setSelectBy(selector: NodeKeySelector<T>): void {
        this.selectBy.set(selector);
    }

    public setSelectableOptions(options: Partial<SelectableOptions>): void {
        this.selectableOptions.update(o => ({ ...o, ...options }));
    }

    public setSelectedDataItems(dataItems: Iterable<T>): void {
        const selectBy = this.selectBy();
        if (!selectBy) {
            this.selectedKeys.update(set => set.clear().addAll(dataItems));
        } else {
            const selectedKeys = from(dataItems).select(d => this.getDataItemSelectKey(d));
            this.selectedKeys.update(set => set.clear().addAll(selectedKeys));
        }
    }

    public setSelectedKeys(keys: Iterable<any>): void {
        const selectedKeys = this.selectedKeys().orderBy(k => k);
        const orderedKeys = from(keys).orderBy(k => k);
        if (sequenceEqual(selectedKeys, orderedKeys)) {
            return;
        }
        this.selectedKeys.set(ImmutableSet.create(keys));
    }

    public setTextField(selector: string | Selector<T, string>): void {
        this.textField.set(selector);
    }

    /**
     * Expands or collapses a node the way user interaction does: disabled nodes are left alone, children of an
     * asynchronous children selector are loaded on first expand, and `nodeExpand$` is notified.
     * @returns whether the expand state changed.
     */
    public toggleNodeExpand(node: TreeNode<T>, expanded: boolean): boolean {
        if (this.isDisabled(node) || this.isExpanded(node) === expanded) {
            return false;
        }
        if (expanded) {
            this.loadNodeChildren(node);
        }
        this.setNodeExpand(node, expanded);
        this.nodeExpand$.next({ node, expanded });
        return true;
    }

    public getCheckKey(node: TreeNode<T>): any {
        const checkBy = this.checkBy();
        if (!checkBy) {
            return node.data;
        }
        if (typeof checkBy === "string") {
            return (node.data as any)[checkBy];
        }
        return checkBy(node.data);
    }

    public getDisableKey(node: TreeNode<T>): any {
        const disableBy = this.disableBy();
        if (!disableBy) {
            return node.data;
        }
        if (typeof disableBy === "string") {
            return (node.data as any)[disableBy];
        }
        return disableBy(node.data);
    }

    private applyCheckedKeysToNodes(): void {
        const checkableOptions = this.checkableOptions();
        const checkedKeys = this.#checkedKeys();
        if (checkedKeys.isEmpty()) {
            return;
        }
        this.#nodeDictionary().forEach(entry => {
            const node = entry.value;
            const key = this.getCheckKey(node);
            node.checked.set(checkedKeys.contains(key));
        });
        if (checkableOptions.enabled && checkableOptions.checkParents && checkableOptions.mode !== "single") {
            const allNodes = TreeService.flatten(this.nodeSet());
            const updatedCheckedKeys = this.#checkedKeys().toEnumerableSet();
            let changed = false;
            // Children before parents, so derived parents feed their own ancestors. Parents are only ever added:
            // a parent key supplied by the consumer is kept even when its children are not all checked.
            allNodes.reverse().forEach(node => {
                if (this.deriveParentChecked(node) !== true || node.checked()) {
                    return;
                }
                node.checked.set(true);
                updatedCheckedKeys.add(this.getCheckKey(node));
                changed = true;
            });
            if (changed) {
                this.#checkedKeys.set(updatedCheckedKeys.toImmutableSet());
            }
        }
    }

    private computeVisibleUids(nodes: Iterable<TreeNode<T>>, filterText: string): Set<string> {
        const visible = new Set<string>();
        for (const node of nodes) {
            const childVisible = this.computeVisibleUids(node.children(), filterText);
            for (const uid of childVisible) {
                visible.add(uid);
            }
            if (childVisible.size > 0 || this.isFiltered(this.getNodeText(node), filterText)) {
                visible.add(node.uid);
            }
        }
        return visible;
    }

    private createFlatNodes(data: Iterable<T>, parentId: string | null): ImmutableSet<TreeNode<T>> {
        const flatIdField = this.#flatIdField();
        const flatParentIdField = this.#flatParentIdField();
        const childrenByParentId = new Map<string | null, T[]>();

        for (const item of data) {
            const dataItem = item as any;
            const pid = dataItem[flatParentIdField] ?? null;
            if (!childrenByParentId.has(pid)) {
                childrenByParentId.set(pid, []);
            }
            childrenByParentId.get(pid)!.push(item);
        }

        const buildNodes = (pid: string | null, parent: TreeNode<T> | null): ImmutableSet<TreeNode<T>> => {
            const items = childrenByParentId.get(pid) ?? [];
            const nodes = new List<TreeNode<T>>();
            for (const item of items) {
                const dataItem = item as any;
                const node = new TreeNode(item);
                node.parent = parent;
                node.children.set(buildNodes(dataItem[flatIdField], node));
                nodes.add(node);
            }
            return nodes.toImmutableSet();
        };

        return buildNodes(parentId, null);
    }

    /**
     * Builds tree nodes for hierarchical data, reusing the existing node of each data item so node state survives
     * a data refresh. A data object that appears more than once gets a node of its own for every extra occurrence.
     */
    private createHierarchicalNodes(
        root: Iterable<T>,
        parent: TreeNode<T> | null,
        existingNodes: Map<T, TreeNode<T>>,
        usedNodes: Set<TreeNode<T>>
    ): ImmutableSet<TreeNode<T>> | null {
        const rootList = new List(root);
        const children = this.children();
        if (rootList.isEmpty()) {
            return null;
        }
        const nodes = new EnumerableSet<TreeNode<T>>();
        for (const dataItem of rootList) {
            const existingNode = existingNodes.get(dataItem);
            const node = existingNode && !usedNodes.has(existingNode) ? existingNode : new TreeNode(dataItem);
            node.parent = parent;
            usedNodes.add(node);

            if (typeof children === "string") {
                const subNodes = (dataItem as any)[children];
                if (subNodes) {
                    const childNodes = this.createHierarchicalNodes(subNodes, node, existingNodes, usedNodes);
                    node.children.update(list => list.clear().addAll(childNodes ?? []));
                }
            } else {
                const result = children(dataItem);
                if (!(result instanceof Observable)) {
                    const childNodes = this.createHierarchicalNodes(result, node, existingNodes, usedNodes);
                    node.children.update(list => list.clear().addAll(childNodes ?? []));
                }
            }
            nodes.add(node);
        }
        return nodes.toImmutableSet();
    }

    private createNodeDictionary(nodes: Iterable<TreeNode<T>>): ImmutableDictionary<string, TreeNode<T>> {
        const flattenedNodes = TreeService.flatten(nodes);
        return flattenedNodes.toImmutableDictionary(
            n => n.uid,
            n => n
        );
    }

    private createNodes(data: Iterable<T>): ImmutableSet<TreeNode<T>> {
        const structure = this.#structure();
        if (structure === "flat") {
            return this.createFlatNodes(data, null).toImmutableSet();
        }
        const existingNodes = new Map<T, TreeNode<T>>();
        for (const node of this.#nodeDictionary().values()) {
            if (!existingNodes.has(node.data)) {
                existingNodes.set(node.data, node);
            }
        }
        return this.createHierarchicalNodes(data, null, existingNodes, new Set()) ?? ImmutableSet.create();
    }

    /**
     * The derived check state of a parent: `true` when all of its check-state children are checked,
     * or `null` when it has none (its own state then stands).
     */
    private deriveParentChecked(node: TreeNode<T>): boolean | null {
        const children = this.getCheckStateChildren(node);
        return children.none() ? null : children.all(c => c.checked());
    }

    /**
     * Children that determine a parent's derived check state: those with a checkbox and, unless
     * `checkDisabledChildren` is set, only enabled ones, because the user cannot change disabled children.
     */
    private getCheckStateChildren(node: TreeNode<T>): IEnumerable<TreeNode<T>> {
        const hasCheckbox = this.#hasCheckboxPredicate();
        const checkDisabledChildren = this.checkableOptions().checkDisabledChildren;
        return node
            .children()
            .where(
                c =>
                    (hasCheckbox === null || hasCheckbox(c.data, c.uid)) &&
                    (checkDisabledChildren || !this.isDisabled(c))
            );
    }

    private getExpandKey(node: TreeNode<T>): any {
        const expandBy = this.expandBy();
        if (!expandBy) {
            return node.data;
        }
        if (typeof expandBy === "string") {
            return (node.data as any)[expandBy];
        }
        return expandBy(node.data);
    }

    private getChildNodes(node: TreeNode<T>): ImmutableSet<TreeNode<T>> {
        const nodes = TreeService.flatten([node]);
        return nodes.where(n => n !== node).toImmutableSet();
    }

    private getDataItemSelectKey(dataItem: T): any {
        const selectBy = this.selectBy();
        if (!selectBy) {
            return dataItem;
        }
        if (typeof selectBy === "string") {
            return (dataItem as any)[selectBy] ?? dataItem;
        }
        return selectBy(dataItem);
    }

    private getParentNodes(node: TreeNode<T>): ImmutableSet<TreeNode<T>> {
        const nodes = new List<TreeNode<T>>();
        let current = node.parent;
        while (current !== null) {
            nodes.add(current);
            current = current.parent;
        }
        return nodes.toImmutableSet();
    }

    private getSelectKey(node: TreeNode<T>): any {
        const selectBy = this.selectBy();
        if (!selectBy) {
            return node.data;
        }
        if (typeof selectBy === "string") {
            return (node.data as any)[selectBy];
        }
        return selectBy(node.data);
    }

    private isAnyParentCollapsed(node: TreeNode<T>): boolean {
        if (node.parent) {
            return !this.isExpanded(node.parent) || this.isAnyParentCollapsed(node.parent);
        }
        return false;
    }

    private isFiltered(nodeText: string, filterText: string): boolean {
        const text = this.filterableOptions().caseSensitive ? nodeText : nodeText.toLowerCase();
        const filter = this.filterableOptions().caseSensitive ? filterText : filterText.toLowerCase();
        const operator = this.filterableOptions().operator;
        if (typeof operator === "function") {
            return operator(text, filter);
        }
        if (operator === "contains") {
            return text.indexOf(filter) >= 0;
        }
        if (operator === "endsWith") {
            return text.endsWith(filter);
        }
        if (operator === "startsWith") {
            return text.startsWith(filter);
        }
        return text.indexOf(filter) >= 0;
    }

    private loadCheckedKeysForChildren(node: TreeNode<T>, childNodes: Iterable<TreeNode<T>>): void {
        const checkedKeys = this.#checkedKeys();
        if (node.checked() && this.checkableOptions().checkChildren) {
            const checkDisabledChildren = this.checkableOptions().checkDisabledChildren;
            const childKeys = new EnumerableSet();
            forEach(childNodes, n => {
                if (checkDisabledChildren || !this.isDisabled(n)) {
                    const childKey = this.getCheckKey(n);
                    childKeys.add(childKey);
                    n.checked.set(true);
                }
            });
            this.#checkedKeys.set(checkedKeys.addAll(childKeys));
        } else {
            forEach(childNodes, n => {
                const childKey = this.getCheckKey(n);
                if (checkedKeys.contains(childKey)) {
                    n.checked.set(true);
                }
            });
        }
    }

    private moveNodeAfter(sourceNode: TreeNode<T>, targetNode: TreeNode<T>): void {
        if (sourceNode.parent) {
            sourceNode.parent.children.update(list => {
                const sourceNodeParent = sourceNode.parent as TreeNode<T>;
                return list.clear().addAll(sourceNodeParent.children().where(n => n !== sourceNode));
            });
        }
        if (targetNode.parent) {
            const index = targetNode.parent.children().toImmutableList().indexOf(targetNode);
            if (index === -1) {
                return;
            }
            targetNode.parent.children.update(set => {
                const tempList = set.toList();
                tempList.addAt(sourceNode, index + 1);
                return tempList.toImmutableSet();
            });

            if (!sourceNode.parent) {
                this.nodeSet.update(nodes => nodes.remove(sourceNode));
            }
            sourceNode.parent = targetNode.parent;
        } else {
            const index = this.nodeSet()
                .where(n => n !== sourceNode)
                .toList()
                .indexOf(targetNode);
            if (index === -1) {
                return;
            }
            this.nodeSet.update(nodes => {
                const newNodes = nodes.where(n => n !== sourceNode).toList();
                newNodes.addAt(sourceNode, index + 1);
                return newNodes.toImmutableSet();
            });
            sourceNode.parent = null;
        }
    }

    private moveNodeBefore(sourceNode: TreeNode<T>, targetNode: TreeNode<T>): void {
        if (sourceNode.parent) {
            sourceNode.parent.children.update(list => {
                const sourceNodeParent = sourceNode.parent as TreeNode<T>;
                return list.clear().addAll(sourceNodeParent.children().where(n => n !== sourceNode));
            });
        }
        if (targetNode.parent) {
            const index = targetNode.parent.children().toImmutableList().indexOf(targetNode);
            if (index === -1) {
                return;
            }
            targetNode.parent.children.update(set => {
                const tempList = set.toList();
                tempList.addAt(sourceNode, index);
                return tempList.toImmutableSet();
            });
            if (!sourceNode.parent) {
                this.nodeSet.update(nodes => nodes.remove(sourceNode));
            }
            sourceNode.parent = targetNode.parent;
        } else {
            const index = this.nodeSet()
                .where(n => n !== sourceNode)
                .toList()
                .indexOf(targetNode);
            if (index === -1) {
                return;
            }
            this.nodeSet.update(nodes => {
                const newNodes = nodes.where(n => n !== sourceNode).toList();
                newNodes.addAt(sourceNode, index);
                return newNodes.toImmutableSet();
            });
            sourceNode.parent = null;
        }
    }

    private moveNodeInside(sourceNode: TreeNode<T>, targetNode: TreeNode<T>): void {
        if (sourceNode.parent === targetNode || this.isDisabled(targetNode)) {
            return;
        }
        if (sourceNode.parent) {
            sourceNode.parent.children.update(list => {
                const sourceNodeParent = sourceNode.parent as TreeNode<T>;
                return list.clear().addAll(sourceNodeParent.children().where(n => n !== sourceNode));
            });
        } else {
            this.nodeSet.update(nodes => nodes.remove(sourceNode));
        }
        targetNode.children.update(list => list.add(sourceNode));
        sourceNode.parent = targetNode;
        this.nodeSet.update(n => n.toImmutableSet());
    }

    private navigateToNextNode(): TreeNode<T> {
        const navigableNodes = this.#navigableNodes();
        const navigatedNode = this.navigatedNode();
        const firstNode = navigableNodes.first();
        const nextNode: TreeNode<T> | null = navigableNodes
            .skipWhile(n => n !== navigatedNode)
            .skip(1)
            .firstOrDefault();
        if (nextNode === null) {
            this.navigatedNode.set(firstNode);
            return firstNode;
        } else {
            this.navigatedNode.set(nextNode);
            return nextNode;
        }
    }

    private navigateToPreviousNode(): TreeNode<T> {
        const navigableNodes = this.#navigableNodes();
        const navigatedNode = this.navigatedNode();
        const previousNode: TreeNode<T> | null = navigableNodes.takeWhile(n => n !== navigatedNode).lastOrDefault();
        if (previousNode === null) {
            this.navigatedNode.set(navigableNodes.last());
            return navigableNodes.last();
        } else {
            this.navigatedNode.set(previousNode);
            return previousNode;
        }
    }

    private recalculateCheckedAncestors(oldParent: TreeNode<T> | null, newParent: TreeNode<T> | null): void {
        const checkableOptions = this.checkableOptions();
        if (!checkableOptions.enabled || !checkableOptions.checkParents || checkableOptions.mode === "single") {
            return;
        }
        const checkedKeys = this.#checkedKeys().toEnumerableSet();
        let changed = false;

        const recalculateNodeChain = (start: TreeNode<T> | null): void => {
            let current = start;
            while (current !== null) {
                const allChecked = this.deriveParentChecked(current);
                if (allChecked === null) {
                    current = current.parent;
                    continue;
                }
                const key = this.getCheckKey(current);
                if (allChecked !== current.checked()) {
                    current.checked.set(allChecked);
                    changed = true;
                }
                if (allChecked && !checkedKeys.contains(key)) {
                    checkedKeys.add(key);
                    changed = true;
                } else if (!allChecked && checkedKeys.contains(key)) {
                    checkedKeys.remove(key);
                    changed = true;
                }
                current = current.parent;
            }
        };

        recalculateNodeChain(oldParent);
        if (newParent !== oldParent) {
            recalculateNodeChain(newParent);
        }
        if (changed) {
            this.#checkedKeys.set(checkedKeys.toImmutableSet());
        }
    }

    private restoreExpandedChildren(childNodes: Iterable<TreeNode<T>>): void {
        const expandedKeys = this.expandedKeys();
        for (const childNode of childNodes) {
            const key = this.getExpandKey(childNode);
            if (expandedKeys.contains(key)) {
                this.loadNodeChildren(childNode);
            }
        }
    }

    private updateNodeIndices(): void {
        const updateRecursively = (nodes: Iterable<TreeNode<T>>, parent: TreeNode<T> | null): void => {
            let index = 0;
            for (const node of nodes) {
                node.index = parent == null ? String(index++) : `${parent.index}.${index++}`;
                updateRecursively(node.children(), node);
            }
        };
        updateRecursively(this.nodeSet(), null);
    }
}
