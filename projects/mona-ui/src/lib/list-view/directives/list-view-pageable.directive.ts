import { Directive, effect, inject, input, untracked } from "@angular/core";
import { PagerSettings } from "@mirei/mona-ui/list";
import { ListService } from "@mirei/mona-ui/list";

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
        pageSizeValues: [5, 10, 20, 25, 50, 100],
        visiblePages: 5
    };
    readonly #listService = inject(ListService);

    public options = input<Partial<PagerSettings> | "">("", {
        alias: "monaListViewPageable"
    });

    public constructor() {
        effect(() => {
            const options = this.options();
            untracked(() => {
                if (options === "") {
                    this.#listService.setPageableOptions(this.#defaultOptions);
                } else {
                    this.#listService.setPageableOptions({
                        ...this.#defaultOptions,
                        ...options
                    });
                }
            });
        });
    }
}
