import { computed, Directive, inject, input } from "@angular/core";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { Row } from "../models/Row";
import { GridService } from "../services/grid.service";
import { gridListTableRowThemeVariants } from "../styles/grid.styles";

@Directive({
    selector: "tr[monaGridRow]",
    host: {
        "[class]": "baseClass()",
        "[attr.data-ruid]": "row().uid",
        "[attr.data-row-view-index]": "index()",
        role: "row",
        "[attr.aria-selected]": "selectable() ? selected() : null",
        "[attr.aria-rowindex]": "ariaRowIndex()"
    },
    exportAs: "monaGridRow"
})
export class GridRowDirective {
    readonly #gridService = inject(GridService);
    readonly #themeService = inject(ThemeService);
    protected readonly ariaRowIndex = computed(() => this.index() + this.#gridService.paginationState().skip + 2);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const selected = this.selected();
        return gridListTableRowThemeVariants(theme)({ selected });
    });
    protected readonly selectable = computed(() => this.#gridService.selectableOptions().enabled);
    public readonly expanded = computed(() => this.#gridService.isRowExpanded(this.row()));
    public readonly index = input.required<number>();
    public readonly row = input.required<Row>();
    public readonly selected = computed(() => this.#gridService.isRowSelected(this.row()));
}
