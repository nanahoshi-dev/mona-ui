import {
    afterNextRender,
    contentChildren,
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
import { type SortDescriptor, SortDirection } from "@nanahoshi/mona-ui/query";
import type { Column } from "../models/Column";
import type { ColumnSortEvent } from "../models/ColumnSortEvent";
import { GRID_COLUMN_DEFINITION, GridColumnDefinition } from "../models/GridColumnDefinition";
import type { SortableOptions } from "../models/SortableOptions";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "mona-grid[monaGridSortable]"
})
export class GridSortableDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridService = inject(GridService);
    private readonly columnDefinitions = contentChildren<GridColumnDefinition>(GRID_COLUMN_DEFINITION);

    /**
     * @description Emitted when a column header is activated to change its sort direction. Call `preventDefault()` on the event to cancel the sort.
     */
    public readonly columnSort = output<ColumnSortEvent>();

    /**
     * @description Enables column sorting on the grid. Pass a `SortableOptions` object to configure sort mode, unsort behavior, or sort-index display.
     * @default ""
     */
    public readonly options = input<SortableOptions | "">("", {
        alias: "monaGridSortable"
    });

    /**
     * @description Current sort descriptors applied to the grid.
     * @default []
     */
    public readonly sort = model<SortDescriptor[]>([]);

    public constructor() {
        effect(() => {
            const options = this.options();
            untracked(() => {
                if (options) {
                    this.#gridService.setSortableOptions(options);
                } else if (options === "") {
                    this.#gridService.setSortableOptions({ enabled: true });
                }
            });
        });
        effect(() => {
            const columns = this.columnDefinitions().map(c => c.getColumn());
            untracked(() => {
                this.#gridService.setColumnDefinitions(columns);
                if (this.sort().length !== 0) {
                    this.#gridService.loadSorts(this.sort());
                }
            });
        });
        effect(() => {
            const sort = this.sort();
            untracked(() => this.#gridService.loadSorts(sort));
        });
        afterNextRender({
            read: () => this.#setSubscriptions()
        });
    }

    private applyColumnSort(column: Column, sortDirection: SortDirection | null): void {
        let appliedSorts = this.#gridService.appliedSorts();
        if (this.#gridService.sortableOptions().mode === "single") {
            this.#gridService
                .columns()
                .where(c => c.field !== column.field)
                .forEach(c => {
                    appliedSorts = appliedSorts.remove(c.field);
                });
        }
        if (sortDirection != null) {
            const sortDescriptor: SortDescriptor = {
                field: column.field,
                dir: sortDirection
            };
            appliedSorts = appliedSorts.put(column.field, { sort: sortDescriptor });
        } else {
            appliedSorts = appliedSorts.remove(column.field);
        }
        this.#gridService.appliedSorts.set(appliedSorts);
        this.#gridService.loadSorts(
            appliedSorts
                .values()
                .select(s => s.sort)
                .toArray()
        );
    }

    #setSubscriptions(): void {
        this.#gridService.columnSort$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
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
            const sortDescriptors = this.#gridService
                .appliedSorts()
                .values()
                .select(s => s.sort)
                .toArray();
            this.sort.set(sortDescriptors);
        });
    }
}
