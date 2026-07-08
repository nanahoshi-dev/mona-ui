import { Directive, effect, inject, input, untracked } from "@angular/core";
import { GroupableOptions, ListService } from "@mirei/mona-ui/internal/list";
import { Selector } from "@mirei/ts-collections";

@Directive({
    selector: `
        mona-auto-complete[monaDropDownGroupable],
        mona-combo-box[monaDropDownGroupable],
        mona-dropdown-list[monaDropDownGroupable],
        mona-multi-select[monaDropDownGroupable],
    `
})
export class DropdownGroupableDirective<TData> {
    readonly #defaultOptions: GroupableOptions<TData, any> = {
        enabled: true,
        headerOrder: "asc"
    };
    readonly #listService: ListService<TData> = inject(ListService);

    public readonly groupBy = input<string | Selector<TData, any> | null | undefined>("");
    public readonly options = input<GroupableOptions<TData, any> | "">("", {
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
