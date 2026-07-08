import { Directive, effect, inject, input, untracked } from "@angular/core";
import { GroupableOptions } from "@mirei/mona-ui/list";
import { ListKeySelector } from "@mirei/mona-ui/list";
import { ListService } from "@mirei/mona-ui/list";

@Directive({
    selector: "mona-list-view[monaListViewGroupable]"
})
export class ListViewGroupableDirective<T, K = T> {
    readonly #defaultOptions: GroupableOptions<T, K> = {
        enabled: true
    };
    readonly #listService = inject(ListService<T>);

    public groupBy = input<ListKeySelector<T, K> | undefined>("");
    public options = input<GroupableOptions<T, K> | "">("", {
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
