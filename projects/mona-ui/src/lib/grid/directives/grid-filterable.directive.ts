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
     * Initial filter configuration to be applied to the grid when it is loaded.
     */
    public readonly filter = model<CompositeFilterDescriptor[]>([]);
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
