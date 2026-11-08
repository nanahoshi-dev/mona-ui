import { DestroyRef, Directive, effect, inject, input, model, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ListService, type PagerSettings } from "@nanahoshi/mona-ui/internal/list";
import type { PageSizeChangeEvent } from "@nanahoshi/mona-ui/pager";
import { ListViewComponent } from "../components/list-view/list-view.component";

@Directive({
    selector: "mona-list-view[monaListViewPageable]"
})
export class ListViewPageableDirective {
    readonly #defaultOptions: PagerSettings = {
        enabled: true,
        showInfo: false,
        firstLast: false,
        type: "numeric",
        previousNext: true,
        pageSize: 10,
        pageSizeValues: [5, 10, 20, 25, 50, 100],
        visiblePages: 5
    };
    readonly #listService = inject(ListService);

    /**
     * @description Enables pagination. An empty string enables pagination with default settings (`type: "numeric"`,
     * `previousNext: true`, `pageSize: 10`, `pageSizeValues: [5, 10, 20, 25, 50, 100]`, `visiblePages: 5`); pass an
     * object to override any field. Has no visible effect while `monaListViewVirtualScroll` is enabled — see Pagination
     * and virtualization don't combine.
     */
    public readonly options = input<Partial<PagerSettings> | "">("", {
        alias: "monaListViewPageable"
    });

    /**
     * @description The current page. Supports two-way binding via `[(page)]`; updates when the user navigates the pager and can be set to navigate programmatically.
     * @default 1
     */
    public readonly page = model<number>(1);

    /**
     * @description Items per page. Supports two-way binding via `[(pageSize)]`: it updates when the user picks a size
     * in the pager. While unset, the options' `pageSize` applies. A new size keeps the first item of the current
     * page in view.
     * @default undefined
     */
    public readonly pageSize = model<number | undefined>(undefined);

    /**
     * @description Emitted when the user picks a page size, before it is applied. Call `preventDefault()` on the
     * event to keep the current size.
     */
    public readonly pageSizeSelect = output<PageSizeChangeEvent>();

    public constructor() {
        effect(() => {
            const options = this.options();
            untracked(() => {
                const mergedOptions = options === "" ? this.#defaultOptions : { ...this.#defaultOptions, ...options };
                this.#listService.setPageableOptions(mergedOptions);
                this.setTake(this.pageSize() ?? mergedOptions.pageSize);
            });
        });
        effect(() => {
            const pageSize = this.pageSize();
            untracked(() => {
                if (pageSize != null) {
                    this.setTake(pageSize);
                }
            });
        });
        effect(() => {
            const page = this.page();
            untracked(() => {
                const pageState = this.#listService.pageState();
                if (pageState.page === page) {
                    return;
                }
                this.#listService.pageState.set({ page, skip: (page - 1) * pageState.take, take: pageState.take });
            });
        });
        effect(() => {
            const pageState = this.#listService.pageState();
            untracked(() => {
                if (this.page() !== pageState.page) {
                    this.page.set(pageState.page);
                }
                // Report sizes the user picked; an unset size stays unset while the options' size applies.
                const pageSize = this.pageSize();
                const optionsSize = this.#listService.pageableOptions().pageSize;
                if (pageSize !== pageState.take && (pageSize != null || pageState.take !== optionsSize)) {
                    this.pageSize.set(pageState.take);
                }
            });
        });
        inject(ListViewComponent)
            .pageSizeSelect$.pipe(takeUntilDestroyed(inject(DestroyRef)))
            .subscribe(event => {
                this.pageSizeSelect.emit(event);
            });
    }

    /** Applies a page size, keeping the first item of the current page in view. */
    private setTake(take: number): void {
        const size = Math.max(1, Math.floor(take) || 1);
        const pageState = this.#listService.pageState();
        if (pageState.take === size) {
            return;
        }
        const page = Math.floor(pageState.skip / size) + 1;
        this.#listService.pageState.set({ page, skip: (page - 1) * size, take: size });
    }
}
