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

    /**
     * @description Enables row virtualization on the grid. Pass a `VirtualScrollOptions` object to configure the fixed row height.
     */
    public readonly options = input<Partial<VirtualScrollOptions> | "" | undefined>(undefined, {
        alias: "monaGridVirtualScroll"
    });

    /**
     * @description Emitted when the scroll position reaches the configured threshold from the bottom of the virtualized list.
     */
    public readonly scrollEnd = output<void>();

    /**
     * @description Distance, in rows, from the bottom of the virtualized list at which `scrollEnd` is emitted.
     * @default 5
     */
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
