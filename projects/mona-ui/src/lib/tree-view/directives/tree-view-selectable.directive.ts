import { DestroyRef, Directive, effect, inject, input, OnInit, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { sequenceEqual } from "@mirei/ts-collections";
import { distinctUntilChanged, pairwise } from "rxjs";
import { NodeItem } from "../../common/tree/models/NodeItem";
import { NodeSelectEvent } from "../../common/tree/models/NodeSelectEvent";
import { TreeSelectableOptions } from "../../common/tree/models/TreeSelectableOptions";
import { NodeKeySelector } from "../../common/tree/models/TreeSelectors";
import { TreeService } from "../../common/tree/services/tree.service";

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
    public readonly nodeSelect = output<NodeSelectEvent<T>>();
    public readonly selectBy = input<NodeKeySelector<T, K> | undefined>("");
    public readonly selectedKeys = input<Iterable<K>>([]);
    public readonly selectedKeysChange = output<Array<K>>();
    public readonly selectionChange = output<NodeItem<T>>();
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
        this.#treeService.selectionChange = this.selectionChange;
        this.#treeService.nodeSelect = this.nodeSelect;
        this.setNodeSelectSubscription();
    }

    private setNodeSelectSubscription(): void {
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
        this.#treeService.selectionChange$
            .pipe(
                distinctUntilChanged((n1, n2) => n1.data === n2.data),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe(nodeItem => {
                if (this.#treeService.selectionChange) {
                    this.#treeService.selectionChange.emit(nodeItem);
                }
            });
    }
}
