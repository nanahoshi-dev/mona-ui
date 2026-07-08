import { afterNextRender, DestroyRef, Directive, effect, inject, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { ColumnResizeEvent } from "../models/ColumnResizeEvent";
import type { ResizableOptions } from "../models/ResizableOptions";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "mona-grid[monaGridResizable]"
})
export class GridResizableDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridService = inject(GridService);
    /**
     * @description Emitted when a column resize completes, with the column and its old and new widths.
     */
    public readonly columnResize = output<ColumnResizeEvent>();

    /**
     * @description Enables column resizing on the grid. Pass a `ResizableOptions` object to configure it explicitly.
     * @default ""
     */
    public readonly options = input<ResizableOptions | "">("", {
        alias: "monaGridResizable"
    });
    public constructor() {
        effect(() => {
            const options = this.options();
            untracked(() => {
                if (options) {
                    this.#gridService.setResizableOptions(options);
                } else if (options === "") {
                    this.#gridService.setResizableOptions({ enabled: true });
                }
            });
        });
        afterNextRender({
            read: () => this.#setSubscriptions()
        });
    }

    #setSubscriptions(): void {
        this.#gridService.columnResize$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            this.columnResize.emit(event);
        });
    }
}
