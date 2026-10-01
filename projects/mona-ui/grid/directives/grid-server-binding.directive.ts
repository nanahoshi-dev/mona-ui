import { DestroyRef, Directive, effect, inject, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { GridDataState } from "../models/GridDataState";
import { GridService } from "../services/grid.service";

@Directive({ selector: "mona-grid[monaGridServerBinding]" })
export class GridServerBindingDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridService = inject(GridService);

    /** @description Emitted once per user paging, sorting, or filtering action with the requested server state. */
    public readonly dataStateChange = output<GridDataState>();

    /** @description Shows a loading overlay while the application requests server data. */
    public readonly loading = input(false);

    /** @description Zero-based offset of the supplied server page. External changes do not request data. */
    public readonly skip = input(0);

    /** @description Total matching server records before paging. Must be a non-negative integer. */
    public readonly total = input.required<number>();

    public constructor() {
        this.#gridService.setServerBindingEnabled(true);
        effect(() => {
            const total = this.total();
            untracked(() => this.#gridService.setServerTotal(total));
        });
        effect(() => {
            const skip = this.skip();
            untracked(() => this.#gridService.setServerSkip(skip));
        });
        effect(() => {
            const loading = this.loading();
            untracked(() => this.#gridService.setServerLoading(loading));
        });
        this.#gridService.dataStateChange$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(state => this.dataStateChange.emit(state));
        this.#destroyRef.onDestroy(() => this.#gridService.setServerBindingEnabled(false));
    }
}
