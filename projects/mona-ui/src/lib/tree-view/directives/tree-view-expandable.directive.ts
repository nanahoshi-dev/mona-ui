import { afterNextRender, DestroyRef, Directive, effect, inject, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { sequenceEqual } from "@mirei/ts-collections";
import { pairwise } from "rxjs";
import { ExpandableOptions } from "../../common/tree/models/ExpandableOptions";
import { NodeKeySelector } from "../../common/tree/models/TreeSelectors";
import { TreeService } from "../../common/tree/services/tree.service";

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
    public readonly expandBy = input<NodeKeySelector<T, K> | undefined>("");
    public readonly expandedKeys = input<Iterable<K>>([]);
    public readonly expandedKeysChange = output<Array<K>>();
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
    }
}
