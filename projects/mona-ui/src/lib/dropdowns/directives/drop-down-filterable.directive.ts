import {
    afterNextRender,
    DestroyRef,
    Directive,
    effect,
    inject,
    input,
    OnInit,
    output,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FilterChangeEvent } from "../../common/filter-input/models/FilterChangeEvent";
import { ListService } from "../../common/list/services/list.service";
import { FilterableOptions } from "../../common/models/FilterableOptions";

@Directive({
    selector: `
        mona-auto-complete[monaDropDownFilterable],
        mona-dropdown-list[monaDropDownFilterable],
        mona-combo-box[monaDropDownFilterable],
        mona-multi-select[monaDropDownFilterable]
    `,
    standalone: true
})
export class DropDownFilterableDirective<TData> {
    readonly #defaultOptions: FilterableOptions = {
        enabled: true,
        operator: "contains",
        debounce: 0,
        caseSensitive: false
    };
    readonly #destroyRef = inject(DestroyRef);
    readonly #listService = inject(ListService);
    public readonly filter = input<string>("");
    public readonly filterChange = output<FilterChangeEvent>();
    public readonly filterPlaceholder = input<string>("");
    public readonly options = input<Partial<FilterableOptions> | "">("", {
        alias: "monaDropDownFilterable"
    });

    public constructor() {
        effect(() => {
            const filter = this.filter();
            untracked(() => this.#listService.setFilter(filter));
        });
        effect(() => {
            const filterPlaceholder = this.filterPlaceholder();
            untracked(() => this.#listService.setFilterPlaceholder(filterPlaceholder));
        });
        effect(() => {
            const options = this.options();
            untracked(() => {
                if (options === "") {
                    this.#listService.setFilterableOptions(this.#defaultOptions);
                } else {
                    this.#listService.setFilterableOptions({
                        ...this.#defaultOptions,
                        ...options,
                        enabled: options.enabled ?? this.#defaultOptions.enabled
                    });
                }
            });
        });
        afterNextRender({
            read: () => {
                this.#listService.filterChange$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(filter => {
                    this.filterChange.emit(filter);
                });
            }
        });
    }
}
