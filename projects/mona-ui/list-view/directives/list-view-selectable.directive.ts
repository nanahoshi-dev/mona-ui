import { Directive, effect, inject, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { type ListKeySelector, ListService, type SelectableOptions } from "@nanahoshi/mona-ui/internal/list";

@Directive({
    selector: "mona-list-view[monaListViewSelectable]"
})
export class ListViewSelectableDirective<T, K = unknown> {
    readonly #defaultOptions: SelectableOptions = {
        mode: "single",
        enabled: true,
        toggleable: false
    };
    readonly #listService = inject<ListService<T>>(ListService);

    public readonly options = input<Partial<SelectableOptions> | "">("", {
        alias: "monaListViewSelectable"
    });
    public readonly selectBy = input<ListKeySelector<T, K> | undefined>("");
    public readonly selectedKeys = input<Iterable<K>>([]);
    public readonly selectedKeysChange = output<Array<K>>();

    public constructor() {
        effect(() => {
            const selectBy = this.selectBy();
            untracked(() => {
                this.#listService.setValueField(selectBy ?? "");
            });
        });
        effect(() => {
            const selectedKeys = this.selectedKeys();
            untracked(() => {
                this.#listService.setSelectedKeys(selectedKeys ?? []);
            });
        });
        effect(() => {
            const options = this.options();
            untracked(() => {
                if (options === "") {
                    this.#listService.setSelectableOptions(this.#defaultOptions);
                } else {
                    this.#listService.setSelectableOptions({
                        ...this.#defaultOptions,
                        ...options
                    });
                }
            });
        });
        this.#listService.selectedKeysChange$
            .pipe(takeUntilDestroyed())
            .subscribe(keys => this.selectedKeysChange.emit(keys as K[]));
    }
}
