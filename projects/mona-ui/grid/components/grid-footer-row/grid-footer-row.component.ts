import { Component, computed, inject, input } from "@angular/core";
import { GridFooterTableCellDirective } from "../../directives/grid-footer-table-cell.directive";
import { GridLockedCellDirective } from "../../directives/grid-locked-cell.directive";
import { GridLogicalCellDirective } from "../../directives/grid-logical-cell.directive";
import type { GridNavigationSection } from "../../services/grid-navigation.service";
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
    imports: [GridFooterCellComponent, GridFooterTableCellDirective, GridLockedCellDirective, GridLogicalCellDirective],
    host: {
        "[class]": "rowClass()",
        role: "row",
        "[attr.aria-rowindex]": "ariaRowIndex()",
        "[attr.aria-level]": "ariaLevel()"
    }
})
export class GridFooterRowComponent {
    protected readonly gridService = inject(GridService);
    protected readonly rowClass = computed(() =>
        gridFooterTableRowThemeVariants({ virtual: this.gridService.virtualScrollOptions().enabled })
    );

    /** A group footer sits one level below its group header (treegrid). */
    public readonly ariaLevel = input<number | null>(null);
    public readonly ariaRowIndex = input<number | null>(null);
    public readonly groupKey = input<string | null>(null);
    /** The row's place in its section: its body index for a group footer, 0 for the grid footer. */
    public readonly rowIndex = input(0);
    /** Group footers are body rows; the grid footer is its own section after the body. */
    public readonly section = input<GridNavigationSection>("footer");
}
