import { Directive, effect, inject, input, untracked } from "@angular/core";
import { ListService, type NavigableOptions } from "@nanahoshi/mona-ui/internal/list";

@Directive({
    selector: "mona-list-view[monaListViewNavigable]"
})
export class ListViewNavigableDirective<T> {
    readonly #defaultOptions: NavigableOptions = {
        enabled: true,
        mode: "select",
        wrap: false
    };
    readonly #listService = inject<ListService<T>>(ListService);

    /**
     * @description Configures keyboard navigation, which is on without the directive. An empty string keeps the
     * defaults (`enabled: true`, `mode: "select"`, `wrap: false`); pass an object to override any field.
     */
    public readonly options = input<Partial<NavigableOptions> | "">("", {
        alias: "monaListViewNavigable"
    });

    public constructor() {
        effect(() => {
            const options = this.options();
            untracked(() => {
                if (options === "") {
                    this.#listService.setNavigableOptions(this.#defaultOptions);
                } else {
                    this.#listService.setNavigableOptions({
                        ...this.#defaultOptions,
                        ...options
                    });
                }
            });
        });
    }
}
