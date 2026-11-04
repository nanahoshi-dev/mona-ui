import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { GridCellDirective } from "../../directives/grid-cell.directive";
import { GridLockedCellDirective } from "../../directives/grid-locked-cell.directive";
import { GridLogicalCellDirective } from "../../directives/grid-logical-cell.directive";
import type { GridViewGroupRow } from "../../models/GridGroup";
import { GridService } from "../../services/grid.service";
import { gridGroupRowThemeVariants } from "../../styles/grid.styles";
import { GridToggleComponent } from "../grid-toggle/grid-toggle.component";

/**
 * A group header row. It indents by the group depth, and its title cell spans the remaining columns.
 */
@Component({
    // Table rows cannot use element selectors.
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "tr[monaGridGroupRow]",
    templateUrl: "./grid-group-row.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [GridCellDirective, GridLockedCellDirective, GridLogicalCellDirective, GridToggleComponent],
    host: {
        "[class]": "rowClass()",
        role: "row",
        "[attr.aria-level]": "group().depth + 1",
        "[attr.aria-expanded]": "!collapsed()",
        "[attr.aria-rowindex]": "ariaRowIndex()"
    }
})
export class GridGroupRowComponent {
    protected readonly collapsed = computed(() => this.gridService.isGroupCollapsed(this.group().groupKey));
    protected readonly gridService = inject(GridService);
    protected readonly indentColumns = computed(() =>
        this.gridService.layout().filter(column => column.kind === "group" && column.depth < this.group().depth)
    );
    protected readonly rowClass = computed(() =>
        gridGroupRowThemeVariants({ virtual: this.gridService.virtualScrollOptions().enabled })
    );
    protected readonly titleClass = computed(() =>
        this.gridService.virtualScrollOptions().enabled
            ? "absolute inset-0 flex items-center text-sm whitespace-nowrap overflow-hidden"
            : "flex min-h-9 items-center text-sm whitespace-nowrap"
    );
    /** The title cell comes after the indents and the reorder placeholder. */
    protected readonly titleColIndex = computed(
        () => this.group().depth + (this.gridService.rowReorderColumnVisible() ? 1 : 0) + 1
    );
    // Everything after the indents and the reorder placeholder.
    protected readonly titleColspan = computed(
        () =>
            this.gridService.layout().length - this.group().depth - (this.gridService.rowReorderColumnVisible() ? 1 : 0)
    );

    public readonly ariaRowIndex = input<number | null>(null);
    public readonly group = input.required<GridViewGroupRow>();
    /** The index of this row among the rendered body rows. */
    public readonly rowIndex = input.required<number>();

    protected toggle(): void {
        this.gridService.toggleGroupCollapse(this.group().groupKey);
    }
}
