import { Directive, effect, inject, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
    type NodeItem,
    type NodeKeySelector,
    type NodeSelectEvent,
    type SelectableOptions,
    TreeService
} from "@nanahoshi/mona-ui/internal/tree";

@Directive({
    selector: "mona-tree-view[monaTreeViewSelectable]",
    exportAs: "monaTreeViewSelectable"
})
export class TreeViewSelectableDirective<T, K = T> {
    readonly #defaultOptions: SelectableOptions = {
        childrenOnly: false,
        enabled: true,
        mode: "single",
        toggleable: false
    };
    readonly #treeService: TreeService<T> = inject(TreeService);

    /**
     * @description Emitted before the user selects or deselects a node, by click or Enter. Call `preventDefault()`
     * to keep the selection as it is; `selectionChange` follows when it isn't prevented.
     */
    public readonly nodeSelect = output<NodeSelectEvent<T>>();

    /**
     * @description Configures selection mode, toggleability, and whether only child nodes are selectable. Merged over `{ childrenOnly: false, enabled: true, mode: "single", toggleable: false }` when applied bare.
     * @default ""
     */
    public readonly options = input<Partial<SelectableOptions> | "">("", {
        alias: "monaTreeViewSelectable"
    });

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
     * @description Emitted with the selected keys when the user selects or deselects a node. Not emitted for keys set
     * through `selectedKeys`.
     */
    public readonly selectedKeysChange = output<Array<K>>();

    /**
     * @description Emitted with the node after the user selects or deselects it (after a `nodeSelect` that wasn't
     * prevented).
     */
    public readonly selectionChange = output<NodeItem<T>>();

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
        this.#treeService.nodeSelect$.pipe(takeUntilDestroyed()).subscribe(event => this.nodeSelect.emit(event));
        this.#treeService.selectedKeysChange$
            .pipe(takeUntilDestroyed())
            .subscribe(keys => this.selectedKeysChange.emit(keys.toArray() as K[]));
        this.#treeService.selectionChange$
            .pipe(takeUntilDestroyed())
            .subscribe(nodeItem => this.selectionChange.emit(nodeItem));
    }
}
