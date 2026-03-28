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
import { FilterChangeEvent } from "../../../common/filter-input/models/FilterChangeEvent";
import { FilterableOptions } from "../../../common/models/FilterableOptions";
import { TreeService } from "../../../common/tree/services/tree.service";

@Directive({
    selector: "mona-drop-down-tree[monaDropDownTreeFilterable]",
    standalone: true
})
export class DropDownTreeFilterableDirective<T> {
    readonly #defaultOptions: FilterableOptions = {
        enabled: true,
        operator: "contains",
        caseSensitive: false,
        debounce: 0
    };
    readonly #destroyRef = inject(DestroyRef);
    readonly #treeService: TreeService<T> = inject(TreeService);

    public readonly filterChange = output<FilterChangeEvent>();

    public filter = input<string>("");
    public filterPlaceholder = input<string>("");
    public options = input<Partial<FilterableOptions> | "">("", {
        alias: "monaDropDownTreeFilterable"
    });

    public constructor() {
        effect(() => {
            const filter = this.filter();
            untracked(() => this.#treeService.filter$.next(filter));
        });
        effect(() => {
            const placeholder = this.filterPlaceholder();
            untracked(() => this.#treeService.filterPlaceholder.set(placeholder));
        });
        effect(() => {
            const options = this.options() ?? "";
            untracked(() => {
                if (options === "") {
                    this.#treeService.setFilterableOptions(this.#defaultOptions);
                } else {
                    this.#treeService.setFilterableOptions({
                        ...this.#defaultOptions,
                        ...options
                    });
                }
            });
        });
        afterNextRender({
            read: () => this.setSubscription()
        });
    }

    private setSubscription() {
        this.#treeService.filterChange$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            this.filterChange.emit(event);
        });
    }
}
