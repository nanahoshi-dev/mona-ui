import { afterNextRender, DestroyRef, Directive, effect, inject, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FilterChangeEvent } from "../../common/filter-input/models/FilterChangeEvent";
import { FilterableOptions } from "../../common/models/FilterableOptions";
import { TreeService } from "../../common/tree/services/tree.service";

@Directive({
    selector: "mona-tree-view[monaTreeViewFilterable]",
    exportAs: "monaTreeViewFilterable"
})
export class TreeViewFilterableDirective<T> {
    readonly #defaultOptions: FilterableOptions = {
        enabled: true,
        operator: "contains",
        caseSensitive: false,
        debounce: 0
    };
    readonly #destroyRef = inject(DestroyRef);
    readonly #treeService: TreeService<T> = inject(TreeService);

    /**
     * @description Current filter text used to narrow the visible nodes.
     * @default ""
     */
    public readonly filter = input<string>("");

    /**
     * @description Emitted when the filter value changes.
     */
    public readonly filterChange = output<FilterChangeEvent>();

    /**
     * @description Placeholder text shown in the filter input.
     * @default ""
     */
    public readonly filterPlaceholder = input<string>("");

    /**
     * @description Configures the filter operator, case sensitivity, and debounce delay. Merged over `{ enabled: true, operator: "contains", caseSensitive: false, debounce: 0 }` when applied bare.
     * @default ""
     */
    public readonly options = input<Partial<FilterableOptions> | "">("", {
        alias: "monaTreeViewFilterable"
    });

    public constructor() {
        effect(() => {
            const filter = this.filter();
            untracked(() => this.#treeService.filter$.next(filter));
        });
        effect(() => {
            const filterPlaceholder = this.filterPlaceholder();
            untracked(() => this.#treeService.filterPlaceholder.set(filterPlaceholder));
        });
        effect(() => {
            const options = this.options();
            untracked(() => {
                if (options === "") {
                    this.#treeService.setFilterableOptions(this.#defaultOptions);
                } else {
                    this.#treeService.setFilterableOptions({
                        ...this.#defaultOptions,
                        ...options
                    });
                }
            });
        });
        afterNextRender({
            read: () => this.setSubscription()
        });
    }

    private setSubscription(): void {
        this.#treeService.filterChange$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            this.filterChange.emit(event);
        });
    }
}
