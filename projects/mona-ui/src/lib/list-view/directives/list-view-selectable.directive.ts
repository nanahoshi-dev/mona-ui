import { afterNextRender, DestroyRef, Directive, effect, inject, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ListKeySelector } from "@mirei/mona-ui/list";
import { SelectableOptions } from "@mirei/mona-ui/list";
import { ListService } from "@mirei/mona-ui/list";

@Directive({
    selector: "mona-list-view[monaListViewSelectable]"
})
export class ListViewSelectableDirective<T, K = unknown> {
    readonly #defaultOptions: SelectableOptions = {
        mode: "single",
        enabled: true,
        toggleable: false
    };
    readonly #destroyRef = inject(DestroyRef);
    readonly #listService = inject<ListService<T>>(ListService);

    public readonly selectedKeysChange = output<Array<K>>();
    public options = input<Partial<SelectableOptions> | "">("", {
        alias: "monaListViewSelectable"
    });
    public selectBy = input<ListKeySelector<T, K> | undefined>("");
    public selectedKeys = input<Iterable<K>>([]);

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
        afterNextRender({
            read: () => {
                this.#listService.selectedKeysChange$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(keys => {
                    this.selectedKeysChange.emit(keys);
                });
            }
        });
    }
}
