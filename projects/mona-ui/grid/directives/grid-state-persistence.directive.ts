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
        afterNextRender({
            read: () => {
                if (this.#isEnabled()) {
                    this.loadState(this.state());
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
            untracked(() => this.loadState(state, options));
        });

        effect(() => {
            if (!this.#initialized() || this.#loadingState || !this.#isEnabled()) {
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

    public captureState(): GridState {
        return this.#gridService.captureState(this.#resolveOptions());
    }

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
