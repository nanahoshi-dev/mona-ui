import { DestroyRef, Directive, effect, inject, input, OnInit, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CheckableOptions, NodeCheckEvent, NodeKeySelector, TreeService } from "@nanahoshi/mona-ui/internal/tree";
import { sequenceEqual } from "@mirei/ts-collections";
import { pairwise } from "rxjs";

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
     * @description Emitted when the checked keys change.
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
     * @description Configures check mode and whether checking a node also checks its children or parents. Merged over `{ checkChildren: true, checkParents: true, enabled: true, mode: "multiple" }` when applied bare.
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
