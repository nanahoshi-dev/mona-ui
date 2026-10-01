import { computed, Directive, inject, input } from "@angular/core";
import { GridService } from "../services/grid.service";
import { type GridRowNeighborType } from "../models/GridRowNeighbourType";
import { gridListTableCellThemeVariants, type GridListTableCellVariantInput } from "../styles/grid.styles";

@Directive({
    selector: "td[monaGridCell]",
    host: {
        "[class]": "baseClass()"
    }
})
export class GridCellDirective implements GridListTableCellVariantInput {
    readonly #gridService = inject(GridService, { optional: true });
    protected readonly baseClass = computed(() => {
        const dataCell = this.dataCell();
        const groupHeader = this.groupHeader();
        const groupToggle = this.groupToggle();
        const grouped = this.grouped();
        const indentCell = this.indentCell();
        const masterDetailContent = this.masterDetailContent();
        const masterDetailToggle = this.masterDetailToggle();
        const lastInRow = this.lastInRow() || groupHeader || masterDetailContent;
        return gridListTableCellThemeVariants({
            virtual: this.#gridService?.virtualScrollOptions().enabled ?? false,
            dataCell,
            groupHeader,
            groupToggle,
            grouped,
            indentCell,
            lastInRow,
            masterDetailContent,
            masterDetailToggle
        });
    });
    public readonly dataCell = input(false);
    public readonly groupHeader = input(false);
    public readonly groupToggle = input(false);
    public readonly grouped = input(false);
    public readonly indentCell = input(false);
    public readonly lastInRow = input(false);
    public readonly masterDetailContent = input(false);
    public readonly masterDetailToggle = input(false);
    public readonly nextRowType = input<GridRowNeighborType>(null);
    public readonly prevRowType = input<GridRowNeighborType>(null);
}
