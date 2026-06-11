import { DestroyRef, Directive, effect, inject, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { VirtualScrollOptions } from "../../common/models/VirtualScrollOptions";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "mona-grid[monaGridVirtualScroll]"
})
export class GridVirtualScrollDirective {
    readonly #defaultOptions: VirtualScrollOptions = {
        enabled: true,
        height: 32
    };
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridService = inject(GridService);

    public readonly options = input<Partial<VirtualScrollOptions> | "" | undefined>(undefined, {
        alias: "monaGridVirtualScroll"
    });
    public readonly scrollEnd = output<void>();
    public readonly scrollEndThreshold = input<number>(5);

    public constructor() {
        effect(() => {
            const options = this.options();
            untracked(() => {
                if (options) {
                    this.#gridService.setVirtualScrollOptions({
                        ...this.#defaultOptions,
                        ...options
                    });
                } else if (options === "") {
                    this.#gridService.setVirtualScrollOptions(this.#defaultOptions);
                }
            });
        });
        effect(() => {
            const threshold = this.scrollEndThreshold();
            untracked(() => this.#gridService.setScrollEndThreshold(threshold));
        });
        this.#gridService.scrollEnd$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => this.scrollEnd.emit());
    }
}
