import { Directive, effect, inject, input, untracked } from "@angular/core";
import { VirtualScrollOptions } from "@mirei/mona-ui/common";
import { ListService } from "@mirei/mona-ui/list";

@Directive({
    selector: `
        mona-auto-complete[monaDropDownVirtualScroll],
        mona-dropdown-list[monaDropDownVirtualScroll],
        mona-combo-box[monaDropDownVirtualScroll],
        mona-multi-select[monaDropDownVirtualScroll]
    `,
    standalone: true
})
export class DropDownVirtualScrollDirective<TData> {
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
