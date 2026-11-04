import { Directive, effect, inject, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
    type CheckableOptions,
    type NodeCheckEvent,
    type NodeKeySelector,
    TreeService
} from "@nanahoshi/mona-ui/internal/tree";

@Directive({
    selector: "mona-tree-view[monaTreeViewCheckable]",
    exportAs: "monaTreeViewCheckable"
})
export class TreeViewCheckableDirective<T, K = T> {
    readonly #defaultOptions: CheckableOptions = {
        checkChildren: true,
        checkDisabledChildren: false,
        checkParents: true,
        childrenOnly: false,
        enabled: true,
        mode: "multiple"
    };
    readonly #treeService: TreeService<T> = inject(TreeService);

    /**
     * @description Property name or accessor used to derive a node's check key from its data. Falls back to the node's data when unset.
     * @default ""
     */
    public readonly checkBy = input<NodeKeySelector<T, K> | undefined>("");

    /**
     * @description Keys of the currently checked nodes.
     * @default []
     */
    public readonly checkedKeys = input<Iterable<K>>([]);

    /**
     * @description Emitted with the checked keys when the user checks or unchecks a node, including the children and
     * parents that check follows (`checkChildren`, `checkParents`). Not emitted for keys set through `checkedKeys`,
     * nor for keys the tree derives on its own: checked parents of checked children set from code, lazily loaded
     * children of a checked node, and ancestors after a drop. Those are reported with the next user change.
     */
    public readonly checkedKeysChange = output<Array<K>>();

    /**
     * @description Predicate that determines whether a node displays a checkbox. When unset, every node displays a checkbox.
     * @default null
     */
    public readonly hasCheckbox = input<((data: T, uid: string) => boolean) | null>(null);

    /**
     * @description Emitted when a node is checked or unchecked.
     */
    public readonly nodeCheck = output<NodeCheckEvent<T>>();

    /**
     * @description Configures check mode and whether checking a node also checks its children or parents. Merged over `{ checkChildren: true, checkDisabledChildren: false, checkParents: true, childrenOnly: false, enabled: true, mode: "multiple" }` when applied bare.
     * @default ""
     */
    public readonly options = input<Partial<CheckableOptions> | "">("", {
        alias: "monaTreeViewCheckable"
    });

    public constructor() {
        effect(() => {
            const checkBy = this.checkBy();
            untracked(() => {
                this.#treeService.setCheckBy(checkBy ?? "");
            });
        });
        effect(() => {
            const checkedKeys = this.checkedKeys();
            untracked(() => {
                this.#treeService.setCheckedKeys(checkedKeys ?? []);
            });
        });
        effect(() => {
            const options = this.options();
            untracked(() => {
                if (options === "") {
                    this.#treeService.setCheckableOptions(this.#defaultOptions);
                } else {
                    this.#treeService.setCheckableOptions({
                        ...this.#defaultOptions,
                        ...options
                    });
                }
            });
        });
        effect(() => {
            const hasCheckbox = this.hasCheckbox();
            untracked(() => {
                this.#treeService.setHasCheckboxPredicate(hasCheckbox);
            });
        });
        this.#treeService.checkedKeysChange$
            .pipe(takeUntilDestroyed())
            .subscribe(keys => this.checkedKeysChange.emit(keys.toArray() as K[]));
        this.#treeService.nodeCheck$.pipe(takeUntilDestroyed()).subscribe(event => this.nodeCheck.emit(event));
    }
}
