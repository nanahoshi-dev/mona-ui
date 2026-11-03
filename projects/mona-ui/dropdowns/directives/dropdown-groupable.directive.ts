import { Directive, effect, inject, input, untracked } from "@angular/core";
import type { Selector } from "@mirei/ts-collections";
import { type GroupableOptions, ListService } from "@nanahoshi/mona-ui/internal/list";

@Directive({
    selector: `
        mona-auto-complete[monaDropDownGroupable],
        mona-combo-box[monaDropDownGroupable],
        mona-dropdown-list[monaDropDownGroupable],
        mona-multi-select[monaDropDownGroupable]
    `
})
export class DropdownGroupableDirective<TData> {
    readonly #defaultOptions: GroupableOptions<TData, unknown> = {
        enabled: true,
        headerOrder: "asc"
    };
    readonly #listService: ListService<TData> = inject(ListService);

    public readonly groupBy = input<string | Selector<TData, unknown> | null | undefined>("");
    public readonly options = input<GroupableOptions<TData, unknown> | "">("", {
        alias: "monaDropDownGroupable"
    });

    public constructor() {
        effect(() => {
            const groupBy = this.groupBy() ?? "";
            untracked(() => this.#listService.setGroupBy(groupBy));
        });
        effect(() => {
            const options = this.options();
            untracked(() => {
                if (options === "") {
                    this.#listService.setGroupableOptions(this.#defaultOptions);
                } else {
                    this.#listService.setGroupableOptions({
                        ...this.#defaultOptions,
                        ...options,
                        enabled: options.enabled ?? this.#defaultOptions.enabled
                    });
                }
            });
        });
    }
}
