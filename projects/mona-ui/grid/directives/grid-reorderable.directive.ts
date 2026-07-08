import { afterNextRender, DestroyRef, Directive, effect, inject, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ColumnReorderEvent } from "../models/ColumnReorderEvent";
import type { ReorderableOptions } from "../models/ReorderableOptions";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "mona-grid[monaGridReorderable]"
})
export class GridReorderableDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridService = inject(GridService);

    /**
     * @description Emitted when a column is dropped into a new position. Call `preventDefault()` on the event to cancel the reorder.
     */
    public readonly columnReorder = output<ColumnReorderEvent>();

    /**
     * @description Enables column reordering via drag and drop. Pass a `ReorderableOptions` object to configure it explicitly.
     * @default ""
     */
    public readonly options = input<ReorderableOptions | "">("", {
        alias: "monaGridReorderable"
    });

    public constructor() {
        effect(() => {
            const options = this.options();
            untracked(() => {
                if (options) {
                    this.#gridService.setReorderableOptions(options);
                } else if (options === "") {
                    this.#gridService.setReorderableOptions({ enabled: true });
                }
            });
        });
        afterNextRender({
            read: () => this.#setSubscription()
        });
    }

    #setSubscription(): void {
        this.#gridService.columnReorder$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            this.columnReorder.emit(event);
        });
    }
}
