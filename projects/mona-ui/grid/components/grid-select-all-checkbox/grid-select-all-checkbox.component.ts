import { Component, computed, inject } from "@angular/core";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { GridService } from "../../services/grid.service";
import { gridSelectAllCellThemeVariants } from "../../styles/grid.styles";

@Component({
    selector: "mona-grid-select-all-checkbox",
    templateUrl: "./grid-select-all-checkbox.component.html",
    imports: [CheckBoxComponent],
    host: {
        "[class]": "hostClass()",
        "(click)": "$event.stopPropagation()"
    }
})
export class GridSelectAllCheckboxComponent {
    readonly #gridService = inject(GridService);
    protected readonly checked = computed(() => this.#gridService.allBulkSelectionRowsSelected());
    protected readonly hostClass = computed(() => gridSelectAllCellThemeVariants());
    protected readonly indeterminate = computed(() => this.#gridService.someBulkSelectionRowsSelected());

    protected onCheckedChange(checked: boolean): void {
        this.#gridService.setBulkSelection(checked);
    }
}
