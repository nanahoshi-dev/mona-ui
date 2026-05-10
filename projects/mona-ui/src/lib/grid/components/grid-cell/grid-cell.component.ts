import { A11yModule } from "@angular/cdk/a11y";
import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { ThemeService } from "../../../theme/services/theme.service";
import { Column } from "../../models/Column";
import { Row } from "../../models/Row";
import { GridNavigationService } from "../../services/grid-navigation.service";
import { GridService } from "../../services/grid.service";
import {
    gridCellBaseThemeVariants,
    gridCellContainerThemeVariants,
    gridCellTextThemeVariants
} from "../../styles/grid.styles";

@Component({
    selector: "mona-grid-cell",
    templateUrl: "./grid-cell.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [A11yModule, NgTemplateOutlet],
    host: {
        "[class]": "baseClass()"
    }
})
export class GridCellComponent {
    readonly #gridNavigationService = inject(GridNavigationService);
    readonly #themeService = inject(ThemeService);

    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridCellBaseThemeVariants(theme)();
    });
    protected readonly cellContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        const editing = false; // this.editing();
        return gridCellContainerThemeVariants(theme)({ editing });
    });
    protected readonly cellTextClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridCellTextThemeVariants(theme)();
    });
    protected readonly gridService = inject(GridService);

    /**
     * @description The column configuration for this cell.
     */
    public column = input.required<Column>();

    /**
     * @description The row data for this cell.
     */
    public row = input.required<Row>();
}
