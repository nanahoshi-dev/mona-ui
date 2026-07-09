import { Directive, effect, inject, input, untracked } from "@angular/core";
import { DisableOptions, NodeKeySelector, TreeService } from "@nanahoshi/mona-ui/internal/tree";

@Directive({
    selector: "mona-tree-view[monaTreeViewDisable]",
    exportAs: "monaTreeViewDisable"
})
export class TreeViewDisableDirective<T, K = T> {
    readonly #defaultOptions: DisableOptions = {
        disableChildren: true,
        enabled: true
    };
    readonly #treeService: TreeService<T> = inject(TreeService);

    /**
     * @description Property name or accessor used to derive a node's disable key from its data. Falls back to the node's data when unset.
     * @default ""
     */
    public readonly disableBy = input<NodeKeySelector<T, K> | undefined>("");

    /**
     * @description Keys of the currently disabled nodes.
     * @default []
     */
    public readonly disabledKeys = input<Iterable<K>>([]);

    /**
     * @description Configures whether disabling a node also disables its children. Merged over `{ disableChildren: true, enabled: true }` when applied bare.
     * @default ""
     */
    public readonly options = input<Partial<DisableOptions> | "">("", {
        alias: "monaTreeViewDisable"
    });

    public constructor() {
        effect(() => {
            const disableBy = this.disableBy();
            untracked(() => {
                this.#treeService.setDisableBy(disableBy ?? "");
            });
        });
        effect(() => {
            const disabledKeys = this.disabledKeys();
            untracked(() => {
                this.#treeService.setDisabledKeys(disabledKeys ?? []);
            });
        });
        effect(() => {
            const options = this.options();
            untracked(() => {
                if (options === "") {
                    this.#treeService.setDisableOptions(this.#defaultOptions);
                } else {
                    this.#treeService.setDisableOptions({
                        ...this.#defaultOptions,
                        ...options
                    });
                }
            });
        });
    }
}
