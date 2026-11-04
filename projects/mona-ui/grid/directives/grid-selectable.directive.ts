import { afterNextRender, DestroyRef, Directive, effect, inject, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ImmutableSet } from "@mirei/ts-collections";
import { pairwise, startWith } from "rxjs";
import type { GridKeySelector } from "../models/GridKeySelector";
import type { SelectableOptions } from "../models/SelectableOptions";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "mona-grid[monaGridSelectable]"
})
export class GridSelectableDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridService = inject(GridService);
    /**
     * @description Enables row selection on the grid. Pass a `SelectableOptions` object to configure single or multiple selection mode. Selection is on unless the object sets `enabled: false`.
     * @default ""
     */
    public readonly options = input<SelectableOptions | "">("", {
        alias: "monaGridSelectable"
    });

    /**
     * @description Field name or function that gives a row's selection key. Without it, rows are selected by the
     * grid's `rowKey` value, or by the data item when there's no `rowKey`.
     * @default ""
     */
    public readonly selectBy = input<GridKeySelector<unknown>>("");

    /**
     * @description Currently selected row keys.
     * @default []
     */
    public readonly selectedKeys = input<Iterable<unknown>>([]);

    /**
     * @description Emitted when the user changes the selection. Not emitted for a `selectedKeys` value set from code.
     */
    public readonly selectedKeysChange = output<unknown[]>();

    public constructor() {
        effect(() => {
            const options = this.options();
            untracked(() => this.#gridService.setSelectableOptions(options === "" ? {} : options));
        });
        effect(() => {
            const selectionKey = this.selectBy();
            untracked(() => {
                this.#gridService.selectBy.set(selectionKey);
            });
        });
        effect(() => {
            const selectedKeys = this.selectedKeys();
            untracked(() => {
                const alreadySelectedKeys = this.#gridService.selectedKeys();
                if (setsEqual(alreadySelectedKeys, ImmutableSet.create(selectedKeys))) {
                    return;
                }
                this.#gridService.loadSelectedKeys(selectedKeys);
            });
        });
        afterNextRender({
            read: () => this.setSubscriptions()
        });
    }

    private setSubscriptions(): void {
        this.#gridService.selectedKeysChange$
            .pipe(startWith(this.#gridService.selectedKeys()), pairwise(), takeUntilDestroyed(this.#destroyRef))
            .subscribe(([oldKeys, newKeys]) => {
                if (setsEqual(oldKeys, newKeys) || this.#gridService.isLoadedSelection(newKeys)) {
                    return;
                }
                this.selectedKeysChange.emit(newKeys.toArray());
            });
    }
}

function setsEqual<T>(left: ImmutableSet<T>, right: ImmutableSet<T>): boolean {
    return left.size() === right.size() && left.all(value => right.contains(value));
}
