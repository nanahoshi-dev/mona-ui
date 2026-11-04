import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, inject, input } from "@angular/core";
import { GridCellDirective } from "../../directives/grid-cell.directive";
import { GridLockedCellDirective } from "../../directives/grid-locked-cell.directive";
import type { Row } from "../../models/Row";
import { GridService } from "../../services/grid.service";

/**
 * The expanded master-detail row below a data row. Leading layout columns get empty indent cells,
 * and the detail template spans the user columns.
 */
@Component({
    // Table rows cannot use element selectors.
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "tr[monaGridDetailRow]",
    templateUrl: "./grid-detail-row.component.html",
    imports: [GridCellDirective, GridLockedCellDirective, NgTemplateOutlet],
    host: {
        role: "row",
        "[attr.aria-rowindex]": "ariaRowIndex()",
        "[attr.aria-level]": "grouped() ? gridService.groupColumns().length + 1 : null",
        "[style.width.px]": "gridService.masterDetailRowWidth()"
    }
})
export class GridDetailRowComponent {
    /** The detail cell follows the leading layout columns. */
    protected readonly contentColIndex = computed(
        () => this.gridService.layout().filter(layoutColumn => layoutColumn.kind !== "column").length + 1
    );
    protected readonly contentColspan = computed(() => Math.max(this.gridService.visibleColumns().length, 1));
    protected readonly gridService = inject(GridService);
    protected readonly grouped = computed(() => this.gridService.groupColumns().length !== 0);

    public readonly ariaRowIndex = input<number | null>(null);
    public readonly row = input.required<Row>();
}
