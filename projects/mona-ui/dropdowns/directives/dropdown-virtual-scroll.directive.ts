import { Directive, effect, inject, input, untracked } from "@angular/core";
import type { VirtualScrollOptions } from "@nanahoshi/mona-ui/common";
import { ListService } from "@nanahoshi/mona-ui/internal/list";

@Directive({
    selector: `
        mona-auto-complete[monaDropDownVirtualScroll],
        mona-dropdown-list[monaDropDownVirtualScroll],
        mona-combo-box[monaDropDownVirtualScroll],
        mona-multi-select[monaDropDownVirtualScroll]
    `
})
export class DropdownVirtualScrollDirective {
    readonly #defaultOptions: VirtualScrollOptions = {
        enabled: true,
        height: 28
    };
    readonly #listService = inject(ListService);
    public readonly options = input<Partial<VirtualScrollOptions> | "">("", {
        alias: "monaDropDownVirtualScroll"
    });

    public constructor() {
        effect(() => {
            const options = this.options();
            untracked(() => {
                if (options === "") {
                    this.#listService.setVirtualScrollOptions(this.#defaultOptions);
                } else {
                    this.#listService.setVirtualScrollOptions({
                        ...this.#defaultOptions,
                        ...options,
                        enabled: options.enabled ?? this.#defaultOptions.enabled
                    });
                }
            });
        });
    }
}
