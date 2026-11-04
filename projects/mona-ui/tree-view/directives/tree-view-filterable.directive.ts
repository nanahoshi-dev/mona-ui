import { Directive, effect, inject, input, model, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FilterableOptions, FilterChangeEvent } from "@nanahoshi/mona-ui/common";
import { TreeService } from "@nanahoshi/mona-ui/internal/tree";

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
    readonly #treeService: TreeService<T> = inject(TreeService);

    /**
     * @description Current filter text used to narrow the visible nodes. Two-way bindable (`[(filter)]`); the user's
     * typing updates it, so setting it from code (including back to `""`) always applies.
     * @default ""
     */
    public readonly filter = model<string>("");

    /**
     * @description Emitted when the user types in the filter input, before the filter applies. Call
     * `preventDefault()` to keep the current filter; otherwise `filterChange` reports the new text.
     */
    public readonly filterInput = output<FilterChangeEvent>();

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
        this.#treeService.filterChange$.pipe(takeUntilDestroyed()).subscribe(event => {
            this.filterInput.emit(event);
            if (!event.isDefaultPrevented()) {
                this.filter.set(event.filter);
            }
        });
    }
}
