import {
    afterNextRender,
    afterRenderEffect,
    DestroyRef,
    Directive,
    effect,
    inject,
    input,
    model,
    output,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter as rxFilter } from "rxjs";
import { CompositeFilterDescriptor } from "../../query/filter/FilterDescriptor";
import { deepEquals } from "../../utils/deepMerge";
import type { FilterableOptions } from "../models/FilterableOptions";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "mona-grid[monaGridFilterable]"
})
export class GridFilterableDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridService = inject(GridService);

    /**
     * @description Current filter descriptors applied to the grid.
     * @default []
     */
    public readonly filter = model<CompositeFilterDescriptor[]>([]);

    /**
     * @description Enables column filtering on the grid. Pass a `FilterableOptions` object to configure whether filters render in the header menu, a filter row, or both.
     * @default ""
     */
    public readonly options = input<FilterableOptions | "">("", {
        alias: "monaGridFilterable"
    });

    constructor() {
        effect(() => {
            const options = this.options();
            untracked(() => {
                if (options) {
                    this.#gridService.setFilterableOptions(options);
                } else {
                    this.#gridService.setFilterableOptions({ enabled: true });
                }
            });
        });
        afterRenderEffect(() => {
            const filter = this.filter();
            untracked(() => this.#gridService.loadFilters(filter));
        });
        afterNextRender({
            read: () => {
                this.#gridService.filterChange$
                    .pipe(
                        takeUntilDestroyed(this.#destroyRef),
                        rxFilter(f => !deepEquals(f, this.filter()))
                    )
                    .subscribe(filter => this.filter.set(filter));
            }
        });
    }
}
