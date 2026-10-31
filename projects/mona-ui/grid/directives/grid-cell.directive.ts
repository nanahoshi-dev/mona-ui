import { computed, Directive, inject, input } from "@angular/core";
import { GridService } from "../services/grid.service";
import { gridListTableCellThemeVariants, type GridListTableCellVariantInput } from "../styles/grid.styles";

@Directive({
    selector: "td[monaGridCell]",
    host: {
        "[class]": "baseClass()",
        role: "gridcell"
    }
})
export class GridCellDirective implements GridListTableCellVariantInput {
    readonly #gridService = inject(GridService, { optional: true });
    protected readonly baseClass = computed(() =>
        gridListTableCellThemeVariants({
            virtual: this.#gridService?.virtualScrollOptions().enabled ?? false,
            groupIndent: this.groupIndent(),
            lastInRow: this.lastInRow() || this.groupHeader()
        })
    );

    /** Marks a group header title cell. It spans to the end of the row, so it draws no end border. */
    public readonly groupHeader = input(false);
    /** Marks an indent cell under a group, which uses the muted group background. */
    public readonly groupIndent = input(false);
    public readonly lastInRow = input(false);
}
