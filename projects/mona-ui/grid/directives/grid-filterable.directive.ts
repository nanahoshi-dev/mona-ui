import { DestroyRef, Directive, effect, inject, input, model, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { deepEquals } from "@nanahoshi/mona-ui/common";
import type { CompositeFilterDescriptor } from "@nanahoshi/mona-ui/query";
import type { FilterableOptions } from "../models/FilterableOptions";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "mona-grid[monaGridFilterable]"
})
export class GridFilterableDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridService = inject(GridService);

    /**
     * @description Current filter descriptors applied to the grid. Conditions on one field show in that column's
     * filter menu (repeated fields are combined with `and`); filters across fields, such as an `or` of two
     * columns, are still applied and reported. Conditions with an unknown operator are ignored. Supports
     * two-way binding.
     * @default []
     */
    public readonly filter = model<CompositeFilterDescriptor[]>([]);

    /**
     * @description Enables column filtering on the grid. Pass a `FilterableOptions` object to configure whether filters render in the header menu, a filter row, or both. Filtering is on unless the object sets `enabled: false`.
     * @default ""
     */
    public readonly options = input<Partial<FilterableOptions> | "">("", {
        alias: "monaGridFilterable"
    });

    public constructor() {
        effect(() => {
            const options = this.options();
            untracked(() => this.#gridService.setFilterableOptions(options === "" ? {} : options));
        });
        // An effect (not an after-render hook), so the first render and server rendering are filtered.
        effect(() => {
            const filter = this.filter();
            untracked(() => this.#gridService.loadFilters(filter));
        });
        this.#gridService.filterChange$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(filter => {
            if (!deepEquals(filter, this.filter())) {
                this.filter.set(filter);
            }
        });
    }
}
