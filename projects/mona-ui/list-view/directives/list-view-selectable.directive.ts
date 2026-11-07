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

    /**
     * @description Enables selection. An empty string enables single selection with default settings; pass an object to
     * configure `mode` (`"single"` or `"multiple"`), `toggleable`, and `checkboxes`.
     */
    public readonly options = input<Partial<SelectableOptions> | "">("", {
        alias: "monaListViewSelectable"
    });
    /**
     * @description Property name or accessor used to derive the selection key from a data item. When omitted, the data
     * item itself is used as the key.
     */
    public readonly selectBy = input<ListKeySelector<T, K> | undefined>("");
    /** @description The selection, expressed as keys rather than items. Bind `[(selectedKeys)]` to keep it in sync. */
    public readonly selectedKeys = input<Iterable<K>>([]);
    /**
     * @description Emitted with the selected keys when the user selects or deselects an item. Not emitted for keys set
     * through `selectedKeys`.
     */
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
