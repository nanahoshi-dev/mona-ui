import { Component, computed, inject, input } from "@angular/core";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { Row } from "../../models/Row";
import { GridService } from "../../services/grid.service";
import { gridSelectionCellThemeVariants } from "../../styles/grid.styles";

@Component({
    selector: "mona-grid-selection-checkbox",
    templateUrl: "./grid-selection-checkbox.component.html",
    imports: [CheckBoxComponent],
    host: {
        "[class]": "hostClass()",
        "(click)": "$event.stopPropagation()"
    }
})
export class GridSelectionCheckboxComponent {
    readonly #gridService = inject(GridService);
    protected readonly ariaLabel = computed(() => {
        const labelFn = this.#gridService.selectableOptions().rowAriaLabel;
        if (labelFn) {
            return labelFn(this.row().data);
        }
        return `Select row ${this.rowIndex() + 1}`;
    });
    protected readonly checked = computed(() => this.#gridService.isRowSelected(this.row()));
    protected readonly hostClass = computed(() => gridSelectionCellThemeVariants());

    /**
     * @description The grid row whose selected state this checkbox controls.
     */
    public readonly row = input.required<Row>();

    /**
     * @description The row's position within its rendered list, used to derive a default accessible label.
     */
    public readonly rowIndex = input.required<number>();

    protected onCheckedChange(checked: boolean): void {
        this.#gridService.setRowSelected(this.row(), checked);
    }
}
