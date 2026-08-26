import { Directive, effect, inject, input, model, untracked } from "@angular/core";
import { ListService, PagerSettings } from "@nanahoshi/mona-ui/internal/list";

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

    public readonly options = input<Partial<PagerSettings> | "">("", {
        alias: "monaListViewPageable"
    });

    /**
     * @description The current page. Supports two-way binding via `[(page)]`; updates when the user navigates the pager and can be set to navigate programmatically.
     * @default 1
     */
    public readonly page = model<number>(1);

    public constructor() {
        effect(() => {
            const options = this.options();
            untracked(() => {
                const mergedOptions = options === "" ? this.#defaultOptions : { ...this.#defaultOptions, ...options };
                this.#listService.setPageableOptions(mergedOptions);
                this.#listService.pageState.update(s => ({ ...s, take: mergedOptions.pageSize }));
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
            });
        });
    }
}
