import { Directive, effect, inject, input, untracked } from "@angular/core";
import { type GroupableOptions, type ListKeySelector, ListService } from "@nanahoshi/mona-ui/internal/list";

@Directive({
    selector: "mona-list-view[monaListViewGroupable]"
})
export class ListViewGroupableDirective<T, K = T> {
    readonly #defaultOptions: GroupableOptions<T, K> = {
        enabled: true
    };
    readonly #listService = inject(ListService<T>);

    /** @description Property name or accessor used to derive the group key from a data item. */
    public readonly groupBy = input<ListKeySelector<T, K> | undefined>("");
    /**
     * @description Enables grouping. An empty string enables grouping with default settings; pass an object to
     * configure `headerOrder`, `headerText`, `orderBy`, and `orderByDirection`.
     */
    public readonly options = input<GroupableOptions<T, K> | "">("", {
        alias: "monaListViewGroupable"
    });

    public constructor() {
        effect(() => {
            const groupBy = this.groupBy();
            untracked(() => {
                this.#listService.setGroupBy(groupBy ?? "");
            });
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
