import { DestroyRef, Directive, effect, inject, input, OnInit, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NodeItem, NodeKeySelector, NodeSelectEvent, TreeSelectableOptions, TreeService } from "@mirei/mona-ui/tree";
import { sequenceEqual } from "@mirei/ts-collections";
import { pairwise } from "rxjs";

@Directive({
    selector: "mona-tree-view[monaTreeViewSelectable]",
    exportAs: "monaTreeViewSelectable"
})
export class TreeViewSelectableDirective<T, K = T> implements OnInit {
    readonly #defaultOptions: TreeSelectableOptions = {
        childrenOnly: false,
        enabled: true,
        mode: "single",
        toggleable: false
    };
    readonly #destroyRef = inject(DestroyRef);
    readonly #treeService: TreeService<T> = inject(TreeService);

    /**
     * @description Emitted when a node is selected or deselected.
     */
    public readonly nodeSelect = output<NodeSelectEvent<T>>();

    /**
     * @description Property name or accessor used to derive a node's selection key from its data. Falls back to the node's data when unset.
     * @default ""
     */
    public readonly selectBy = input<NodeKeySelector<T, K> | undefined>("");

    /**
     * @description Keys of the currently selected nodes.
     * @default []
     */
    public readonly selectedKeys = input<Iterable<K>>([]);

    /**
     * @description Emitted when the selected keys change.
     */
    public readonly selectedKeysChange = output<Array<K>>();

    /**
     * @description Emitted when the selection changes.
     */
    public readonly selectionChange = output<NodeItem<T>>();

    /**
     * @description Configures selection mode, toggleability, and whether only child nodes are selectable. Merged over `{ childrenOnly: false, enabled: true, mode: "single", toggleable: false }` when applied bare.
     * @default ""
     */
    public readonly options = input<Partial<TreeSelectableOptions> | "">("", {
        alias: "monaTreeViewSelectable"
    });

    public constructor() {
        effect(() => {
            const selectBy = this.selectBy();
            untracked(() => this.#treeService.setSelectBy(selectBy ?? ""));
        });
        effect(() => {
            const selectedKeys = this.selectedKeys();
            untracked(() => this.#treeService.setSelectedKeys(selectedKeys ?? []));
        });
        effect(() => {
            const options = this.options();
            untracked(() => {
                if (options === "") {
                    this.#treeService.setSelectableOptions(this.#defaultOptions);
                } else {
                    this.#treeService.setSelectableOptions({
                        ...this.#defaultOptions,
                        ...options
                    });
                }
            });
        });
    }

    public ngOnInit(): void {
        this.setNodeSelectSubscription();
    }

    private setNodeSelectSubscription(): void {
        this.#treeService.nodeSelect$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            this.nodeSelect.emit(event);
        });
        this.#treeService.selectedKeys$
            .pipe(pairwise(), takeUntilDestroyed(this.#destroyRef))
            .subscribe(([oldKeys, keys]) => {
                const orderedOldKeys = oldKeys.orderBy(k => k);
                const orderedKeys = keys.orderBy(k => k);
                if (sequenceEqual(orderedOldKeys, orderedKeys)) {
                    return;
                }
                this.selectedKeysChange.emit(keys.toArray());
            });
        this.#treeService.selectionChange$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(nodeItem => {
            this.selectionChange.emit(nodeItem);
        });
    }
}
