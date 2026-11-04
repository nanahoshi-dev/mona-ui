import { DestroyRef, Directive, effect, inject, input, model, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { deepEquals } from "@nanahoshi/mona-ui/common";
import type { GroupableOptions } from "../models/GroupableOptions";
import type { GroupDescriptor } from "../models/GroupDescriptor";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "mona-grid[monaGridGroupable]"
})
export class GridGroupableDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridService = inject(GridService);

    /**
     * @description Current group descriptors applied to the grid. A repeated field keeps its last descriptor;
     * a field without a column is grouped once its column appears. Supports two-way binding: `groupChange`
     * emits after the user groups, ungroups, reorders or re-sorts groups, and after a grid state is restored,
     * never for a value set here.
     * @default []
     */
    public readonly group = model<GroupDescriptor[]>([]);

    /**
     * @description Enables column grouping on the grid. Pass a `GroupableOptions` object to configure group footer display. Grouping is on unless the object sets `enabled: false`.
     */
    public readonly options = input<Partial<GroupableOptions> | "" | undefined>(undefined, {
        alias: "monaGridGroupable"
    });

    public constructor() {
        effect(() => {
            const options = this.options();
            untracked(() => this.#gridService.setGroupableOptions(options || {}));
        });
        effect(() => {
            const group = this.group();
            untracked(() => this.#gridService.loadGroupColumns(group));
        });
        this.#gridService.groupChange$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(groups => {
            if (!deepEquals(groups, this.group())) {
                this.group.set(groups);
            }
        });
    }
}
