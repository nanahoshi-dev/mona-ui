import { Directive, effect, inject, input, untracked } from "@angular/core";
import type { VirtualScrollOptions } from "@nanahoshi/mona-ui/common";
import { ListService } from "@nanahoshi/mona-ui/internal/list";

@Directive({
    selector: "mona-list-view[monaListViewVirtualScroll]"
})
export class ListViewVirtualScrollDirective<T> {
    readonly #listService = inject(ListService<T>);
    /**
     * @description Enables virtual scrolling. `height` is the fixed row height, in pixels, used to measure the
     * viewport; when omitted, a `28`px row height is assumed.
     */
    public readonly options = input.required<VirtualScrollOptions>({
        alias: "monaListViewVirtualScroll"
    });

    public constructor() {
        effect(() => {
            const options = this.options();
            untracked(() => this.#listService.setVirtualScrollOptions(options));
        });
    }
}
