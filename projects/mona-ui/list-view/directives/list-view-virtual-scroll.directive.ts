import { Directive, effect, inject, input, untracked } from "@angular/core";
import { VirtualScrollOptions } from "@mirei/mona-ui/common";
import { ListService } from "@mirei/mona-ui/internal/list";

@Directive({
    selector: "mona-list-view[monaListViewVirtualScroll]"
})
export class ListViewVirtualScrollDirective<T> {
    readonly #listService = inject(ListService<T>);
    public options = input.required<VirtualScrollOptions>({
        alias: "monaListViewVirtualScroll"
    });

    public constructor() {
        effect(() => {
            const options = this.options();
            untracked(() => this.#listService.setVirtualScrollOptions(options));
        });
    }
}
