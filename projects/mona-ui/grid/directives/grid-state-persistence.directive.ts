import { afterNextRender, Directive, effect, inject, input, model, signal, untracked } from "@angular/core";
import { deepEquals } from "@nanahoshi/mona-ui/common";
import type { GridState, GridStateLoadResult, GridStatePersistenceOptions } from "../models/GridState";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "mona-grid[monaGridStatePersistence]",
    exportAs: "monaGridStatePersistence"
})
export class GridStatePersistenceDirective {
    readonly #gridService = inject(GridService);
    readonly #initialized = signal(false);
    #emittingState = false;
    #loadingState = false;

    /**
     * @description State persistence options such as schema version and page size persistence.
     */
    public readonly options = input<GridStatePersistenceOptions | "">("", {
        alias: "monaGridStatePersistence"
    });

    /**
     * @description The persisted grid state to apply and update when the grid state changes.
     */
    public readonly state = model<GridState | null>(null);

    public constructor() {
        // Applies the bound state once the columns exist; it reads no layout.
        afterNextRender({
            write: () => {
                if (this.#isEnabled()) {
                    const result = this.loadState(this.state());
                    if (result.status === "applied") {
                        this.#gridService.requestDataStateChange({ resetPage: true });
                    }
                }
                this.#initialized.set(true);
            }
        });

        effect(() => {
            const state = this.state();
            const options = this.#resolveOptions();
            if (!this.#initialized() || this.#emittingState || !this.#isEnabled()) {
                return;
            }
            untracked(() => {
                if (!deepEquals(state, this.#gridService.captureState(options))) {
                    this.loadState(state, options);
                }
            });
        });

        effect(() => {
            // A column drag reports its width once, when it ends.
            if (
                !this.#initialized() ||
                this.#loadingState ||
                !this.#isEnabled() ||
                this.#gridService.columnResizeActive()
            ) {
                return;
            }
            const state = this.#gridService.captureState(this.#resolveOptions());
            untracked(() => {
                if (deepEquals(state, this.state())) {
                    return;
                }
                this.#emittingState = true;
                this.state.set(state);
                this.#emittingState = false;
            });
        });
    }

    /** Captures the grid's current state (columns, sort, filter, group) without waiting for the next change cycle. */
    public captureState(): GridState {
        return this.#gridService.captureState(this.#resolveOptions());
    }

    /**
     * Applies a previously captured state to the grid. A state that isn't well formed (a missing array, a duplicate
     * column id, an unknown filter operator, a page size or width that isn't a positive number) returns
     * `rejected-invalid` and changes nothing.
     */
    public loadState(
        state: GridState | null,
        options: GridStatePersistenceOptions = this.#resolveOptions()
    ): GridStateLoadResult {
        this.#loadingState = true;
        try {
            const result = this.#gridService.applyState(state, options);
            if (!deepEquals(state, this.state())) {
                this.state.set(state);
            }
            return result;
        } finally {
            this.#loadingState = false;
        }
    }

    #isEnabled(): boolean {
        return this.#resolveOptions().enabled !== false;
    }

    #resolveOptions(): GridStatePersistenceOptions {
        const options = this.options();
        return options === "" ? {} : options;
    }
}
