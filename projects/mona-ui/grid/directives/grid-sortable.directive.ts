import { DestroyRef, Directive, effect, inject, input, model, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { deepEquals } from "@nanahoshi/mona-ui/common";
import type { SortDescriptor, SortDirection } from "@nanahoshi/mona-ui/query";
import type { Column } from "../models/Column";
import type { ColumnSortEvent } from "../models/ColumnSortEvent";
import type { SortableOptions } from "../models/SortableOptions";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "mona-grid[monaGridSortable]"
})
export class GridSortableDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridService = inject(GridService);

    /**
     * @description Emitted when a column header is activated to change its sort direction. Call `preventDefault()` on the event to cancel the sort.
     */
    public readonly columnSort = output<ColumnSortEvent>();

    /**
     * @description Enables column sorting on the grid. Pass a `SortableOptions` object to configure sort mode, unsort behavior, or sort-index display. Sorting is on unless the object sets `enabled: false`.
     * @default ""
     */
    public readonly options = input<SortableOptions | "">("", {
        alias: "monaGridSortable"
    });

    /**
     * @description Current sort descriptors applied to the grid. Descriptors are kept even when no column shows
     * the field, and a repeated field keeps its last descriptor. Supports two-way binding; a restored grid
     * state updates it too.
     * @default []
     */
    public readonly sort = model<SortDescriptor[]>([]);

    public constructor() {
        effect(() => {
            const options = this.options();
            untracked(() => this.#gridService.setSortableOptions(options === "" ? {} : options));
        });
        effect(() => {
            const sort = this.sort();
            untracked(() => this.#gridService.loadSorts(sort));
        });
        this.#gridService.sortChange$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(sorts => {
            if (!deepEquals(sorts, this.sort())) {
                this.sort.set(sorts);
            }
        });
        this.#gridService.columnSort$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            if (!this.#gridService.sortableOptions().enabled || !event.column.sortable) {
                return;
            }
            this.columnSort.emit(event);
            if (event.isDefaultPrevented()) {
                return;
            }
            const column = event.column;
            let nextSortDirection: SortDirection | null;
            if (column.columnSortDirection == null) {
                nextSortDirection = "asc";
            } else if (column.columnSortDirection === "asc") {
                nextSortDirection = "desc";
            } else if (this.#gridService.sortableOptions().allowUnsort) {
                nextSortDirection = null;
            } else {
                nextSortDirection = "asc";
            }
            this.applyColumnSort(column, nextSortDirection);
            this.sort.set(this.#gridService.getSortDescriptors());
            this.#gridService.requestDataStateChange({ resetPage: true });
        });
    }

    private applyColumnSort(column: Column, sortDirection: SortDirection | null): void {
        const current = this.#gridService.getSortDescriptors();
        const existing = current.find(sort => sort.field === column.field);
        const sorts = this.#gridService.sortableOptions().mode === "single" ? [] : current;
        const index = sorts.findIndex(sort => sort.field === column.field);
        if (sortDirection != null) {
            // Keep a comparator the consumer supplied, through the descriptor or the column.
            const comparator = column.sortComparator ?? existing?.sort;
            const sortDescriptor: SortDescriptor = comparator
                ? { field: column.field, dir: sortDirection, sort: comparator }
                : { field: column.field, dir: sortDirection };
            if (index < 0) {
                sorts.push(sortDescriptor);
            } else {
                sorts[index] = sortDescriptor;
            }
        } else if (index >= 0) {
            sorts.splice(index, 1);
        }
        this.#gridService.loadSorts(sorts);
    }
}
