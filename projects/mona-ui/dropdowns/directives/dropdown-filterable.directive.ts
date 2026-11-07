import { afterNextRender, DestroyRef, Directive, effect, inject, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FilterChangeEvent } from "@nanahoshi/mona-ui/common";
import { ListService } from "@nanahoshi/mona-ui/internal/list";
import type { FilterableOptions } from "@nanahoshi/mona-ui/common";

@Directive({
    selector: `
        mona-auto-complete[monaDropDownFilterable],
        mona-dropdown-list[monaDropDownFilterable],
        mona-combo-box[monaDropDownFilterable],
        mona-multi-select[monaDropDownFilterable]
    `
})
export class DropdownFilterableDirective {
    readonly #defaultOptions: FilterableOptions = {
        enabled: true,
        operator: "contains",
        debounce: 0,
        caseSensitive: false
    };
    readonly #destroyRef = inject(DestroyRef);
    readonly #listService = inject(ListService);
    /** @description Current filter text used to narrow the visible options. */
    public readonly filter = input<string>("");
    /** @description Emitted when the filter value changes. Cancelable. */
    public readonly filterChange = output<FilterChangeEvent>();
    /**
     * @description Placeholder text in the popup's filter row. Auto Complete has no filter row, since its own input is
     * the filter, so it ignores this.
     * @default ""
     */
    public readonly filterPlaceholder = input<string>("");
    /**
     * @description Filter operator, case sensitivity, and debounce delay. An empty string enables filtering with
     * default settings (`operator: "contains"`, `caseSensitive: false`, `debounce: 0`); pass an object to override any
     * field.
     */
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
