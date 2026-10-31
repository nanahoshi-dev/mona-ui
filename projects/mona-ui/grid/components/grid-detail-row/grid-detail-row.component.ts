import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
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
    template: `
        @for (layoutColumn of gridService.layout(); track layoutColumn.key) {
            @if (layoutColumn.kind === "group") {
                <td
                    monaGridCell
                    [monaGridLockedCell]="layoutColumn.key"
                    [lockedCellHeader]="true"
                    [grouped]="true"
                    [indentCell]="true"></td>
            } @else if (layoutColumn.kind === "reorder") {
                <td
                    monaGridCell
                    [monaGridLockedCell]="layoutColumn.key"
                    [grouped]="grouped()"
                    [indentCell]="grouped()"></td>
            } @else if (layoutColumn.kind === "detail") {
                <td monaGridCell [monaGridLockedCell]="layoutColumn.key" [indentCell]="true"></td>
            } @else if (layoutColumn.kind === "selection") {
                <td monaGridCell [monaGridLockedCell]="layoutColumn.key"></td>
            }
        }
        <td monaGridCell [masterDetailContent]="true" [attr.colspan]="contentColspan()">
            <ng-container
                [ngTemplateOutlet]="gridService.masterDetailTemplate()"
                [ngTemplateOutletContext]="{ $implicit: row().data }" />
        </td>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [GridCellDirective, GridLockedCellDirective, NgTemplateOutlet],
    host: {
        role: "row",
        "[style.width.px]": "gridService.masterDetailRowWidth()"
    }
})
export class GridDetailRowComponent {
    protected readonly contentColspan = computed(() => Math.max(this.gridService.visibleColumns().length, 1));
    protected readonly gridService = inject(GridService);
    protected readonly grouped = computed(() => this.gridService.groupColumns().length !== 0);

    public readonly row = input.required<Row>();
}
