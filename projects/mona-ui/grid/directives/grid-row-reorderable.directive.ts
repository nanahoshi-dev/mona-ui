import {
    afterNextRender,
    DestroyRef,
    Directive,
    effect,
    inject,
    input,
    isDevMode,
    output,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { RowReorderableOptions } from "../models/RowReorderableOptions";
import type { RowReorderEvent } from "../models/RowReorderEvent";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "mona-grid[monaGridRowReorderable]"
})
export class GridRowReorderableDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridService: GridService = inject(GridService);
    #hasWarnedMissingRowKey = false;

    /**
     * @description Enables row reordering via the reorder-handle column. Pass a `RowReorderableOptions`
     * object to configure it explicitly.
     * @default ""
     */
    public readonly options = input<RowReorderableOptions | "">("", {
        alias: "monaGridRowReorderable"
    });

    /**
     * @description Emitted when a row is moved to a new position. The event carries the moved row,
     * source- and page-relative indices, and the complete reordered application data.
     */
    public readonly rowReorder = output<RowReorderEvent>();

    public constructor() {
        effect(() => {
            const options = this.options();
            const enabled = options === "" || options.enabled !== false;
            const missingRowKey = enabled && this.#gridService.rowKey() == null;
            untracked(() => {
                if (options === "") {
                    this.#gridService.setRowReorderableOptions({ enabled: true });
                } else {
                    this.#gridService.setRowReorderableOptions(options);
                }
                if (missingRowKey && isDevMode() && !this.#hasWarnedMissingRowKey) {
                    this.#hasWarnedMissingRowKey = true;
                    console.warn(
                        "[mona-ui] Row reordering is enabled on <mona-grid> but no [rowKey] is set. " +
                            "Row identity may not stay stable when data is rebound after a reorder; set [rowKey] " +
                            "or ensure the consumer reuses the same object references when applying reorderedData."
                    );
                }
            });
        });
        afterNextRender({
            read: () => this.#setSubscriptions()
        });
    }

    #setSubscriptions(): void {
        this.#gridService.rowReorder$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            this.rowReorder.emit(event);
        });
    }
}
