import { computed, Directive, inject, input } from "@angular/core";
import { ThemeService } from "../../theme/services/theme.service";
import { Row } from "../models/Row";
import { GridService } from "../services/grid.service";
import { gridListTableRowThemeVariants } from "../styles/grid.styles";

@Directive({
    selector: "tr[monaGridRow]",
    host: {
        "[class]": "baseClass()",
        "[attr.data-ruid]": "row().uid",
        "[attr.data-row-view-index]": "index()"
    },
    exportAs: "monaGridRow"
})
export class GridRowDirective {
    readonly #gridService = inject(GridService);
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const selected = this.selected();
        return gridListTableRowThemeVariants(theme)({ selected });
    });
    public readonly expanded = computed(() => this.#gridService.isRowExpanded(this.row()));
    public readonly index = input.required<number>();
    public readonly row = input.required<Row>();
    public readonly selected = computed(() => this.#gridService.isRowSelected(this.row()));
}
