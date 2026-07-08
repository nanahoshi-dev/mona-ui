import { afterNextRender, DestroyRef, Directive, effect, inject, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { sequenceEqual } from "@mirei/ts-collections";
import { pairwise } from "rxjs";
import { ExpandableOptions } from "@mirei/mona-ui/tree";
import { NodeItem } from "@mirei/mona-ui/tree";
import { NodeKeySelector } from "@mirei/mona-ui/tree";
import { TreeService } from "@mirei/mona-ui/tree";

@Directive({
    selector: "mona-tree-view[monaTreeViewExpandable]",
    exportAs: "monaTreeViewExpandable"
})
export class TreeViewExpandableDirective<T, K = T> {
    readonly #defaultOptions: ExpandableOptions = {
        enabled: true
    };
    readonly #destroyRef = inject(DestroyRef);
    readonly #treeService: TreeService<T> = inject(TreeService);
    /**
     * @description Emitted when a node is collapsed.
     */
    public readonly collapse = output<NodeItem<T>>();

    /**
     * @description Emitted when a node is expanded.
     */
    public readonly expand = output<NodeItem<T>>();

    /**
     * @description Property name or accessor used to derive a node's expand key from its data. Falls back to the node's data when unset.
     * @default ""
     */
    public readonly expandBy = input<NodeKeySelector<T, K> | undefined>("");

    /**
     * @description Keys of the currently expanded nodes.
     * @default []
     */
    public readonly expandedKeys = input<Iterable<K>>([]);

    /**
     * @description Emitted when the expanded keys change.
     */
    public readonly expandedKeysChange = output<Array<K>>();

    /**
     * @description Configures whether expanding and collapsing nodes is enabled. Merged over `{ enabled: true }` when applied bare.
     * @default ""
     */
    public readonly options = input<Partial<ExpandableOptions> | "">("", {
        alias: "monaTreeViewExpandable"
    });

    public constructor() {
        effect(() => {
            const expandBy = this.expandBy();
            untracked(() => {
                this.#treeService.setExpandBy(expandBy ?? "");
            });
        });
        effect(() => {
            const expandedKeys = this.expandedKeys();
            untracked(() => {
                this.#treeService.setExpandedKeys(expandedKeys ?? []);
            });
        });
        effect(() => {
            const options = this.options();
            untracked(() => {
                if (options === "") {
                    this.#treeService.setExpandableOptions(this.#defaultOptions);
                } else {
                    this.#treeService.setExpandableOptions({
                        ...this.#defaultOptions,
                        ...options
                    });
                }
            });
        });
        afterNextRender({
            read: () => this.setSubscriptions()
        });
    }

    public setSubscriptions(): void {
        this.#treeService.expandedKeys$
            .pipe(pairwise(), takeUntilDestroyed(this.#destroyRef))
            .subscribe(([oldKeys, keys]) => {
                const orderedOldKeys = oldKeys.orderBy(k => k);
                const orderedKeys = keys.orderBy(k => k);
                if (sequenceEqual(orderedOldKeys, orderedKeys)) {
                    return;
                }
                this.expandedKeysChange.emit(keys.toArray());
            });
        this.#treeService.nodeExpand$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            if (event.expanded) {
                this.expand.emit(event.node.nodeItem);
            } else {
                this.collapse.emit(event.node.nodeItem);
            }
        });
    }
}
