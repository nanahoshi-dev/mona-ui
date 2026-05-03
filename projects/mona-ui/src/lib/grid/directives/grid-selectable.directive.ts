import { afterNextRender, DestroyRef, Directive, effect, inject, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { orderBy, select, sequenceEqual } from "@mirei/ts-collections";
import { pairwise, startWith } from "rxjs";
import { GridSelectableOptions } from "../models/GridSelectableOptions";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "mona-grid[monaGridSelectable]"
})
export class GridSelectableDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridService = inject(GridService);
    public readonly options = input<GridSelectableOptions | "">("", {
        alias: "monaGridSelectable"
    });
    public readonly selectBy = input<string>("");
    public readonly selectedKeys = input<Iterable<unknown>>([]);
    public readonly selectedKeysChange = output<unknown[]>();

    public constructor() {
        effect(() => {
            const options = this.options();
            untracked(() => {
                if (options) {
                    this.#gridService.setSelectableOptions(options);
                } else if (options === "") {
                    this.#gridService.setSelectableOptions({ enabled: true });
                }
            });
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
                if (
                    sequenceEqual(
                        orderBy(alreadySelectedKeys, k => k),
                        orderBy(selectedKeys, k => k)
                    )
                ) {
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
                if (oldKeys.order().sequenceEqual(newKeys.order())) {
                    return;
                }
                this.selectedKeysChange.emit(newKeys.toArray());
            });
    }
}
