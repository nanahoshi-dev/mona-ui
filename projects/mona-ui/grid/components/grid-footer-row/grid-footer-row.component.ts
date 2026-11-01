import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { GridFooterTableCellDirective } from "../../directives/grid-footer-table-cell.directive";
import { GridLockedCellDirective } from "../../directives/grid-locked-cell.directive";
import { GridService } from "../../services/grid.service";
import { gridFooterTableRowThemeVariants } from "../../styles/grid.styles";
import { GridFooterCellComponent } from "../grid-footer-cell/grid-footer-cell.component";

/**
 * An aggregate footer row. Without a group key it shows the grid-wide aggregates,
 * otherwise the aggregates of that group.
 */
@Component({
    // Table rows cannot use element selectors.
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "tr[monaGridFooterRow]",
    templateUrl: "./grid-footer-row.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [GridFooterCellComponent, GridFooterTableCellDirective, GridLockedCellDirective],
    host: {
        "[class]": "rowClass()",
        role: "row"
    }
})
export class GridFooterRowComponent {
    protected readonly gridService = inject(GridService);
    protected readonly rowClass = computed(() =>
        gridFooterTableRowThemeVariants({ virtual: this.gridService.virtualScrollOptions().enabled })
    );

    public readonly groupKey = input<string | null>(null);
}
