import { DestroyRef, Directive, effect, inject, input, OnInit, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { sequenceEqual } from "@mirei/ts-collections";
import { pairwise } from "rxjs";
import { CheckableOptions } from "../../common/tree/models/CheckableOptions";
import { NodeCheckEvent } from "../../common/tree/models/NodeCheckEvent";
import { NodeKeySelector } from "../../common/tree/models/TreeSelectors";
import { TreeService } from "../../common/tree/services/tree.service";

@Directive({
    selector: "mona-tree-view[monaTreeViewCheckable]",
    exportAs: "monaTreeViewCheckable"
})
export class TreeViewCheckableDirective<T, K = T> implements OnInit {
    readonly #defaultOptions: CheckableOptions = {
        checkChildren: true,
        checkParents: true,
        enabled: true,
        mode: "multiple"
    };
    readonly #destroyRef = inject(DestroyRef);
    readonly #treeService: TreeService<T> = inject(TreeService);
    public readonly checkBy = input<NodeKeySelector<T, K> | undefined>("");
    public readonly checkedKeys = input<Iterable<K>>([]);
    public readonly checkedKeysChange = output<Array<K>>();
    public readonly nodeCheck = output<NodeCheckEvent<T>>();
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
    }

    public ngOnInit(): void {
        this.setNodeCheckSubscription();
    }

    private setNodeCheckSubscription(): void {
        this.#treeService.checkedKeys$
            .pipe(pairwise(), takeUntilDestroyed(this.#destroyRef))
            .subscribe(([oldKeys, keys]) => {
                const orderedOldKeys = oldKeys.orderBy(k => k);
                const orderedKeys = keys.orderBy(k => k);
                if (sequenceEqual(orderedOldKeys, orderedKeys)) {
                    return;
                }
                this.checkedKeysChange.emit(keys.toArray());
            });
        this.#treeService.nodeCheck$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            this.nodeCheck.emit(event);
        });
    }
}
