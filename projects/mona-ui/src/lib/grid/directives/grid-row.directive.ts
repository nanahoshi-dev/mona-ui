import { computed, Directive, inject, input } from "@angular/core";
import { ThemeService } from "../../theme/services/theme.service";
import { Row } from "../models/Row";
import { gridListTableRowThemeVariants } from "../styles/grid.styles";

@Directive({
    selector: "[monaGridRow]",
    host: {
        "[class]": "baseClass()",
        "[attr.data-ruid]": "row().uid",
        "[attr.data-row-view-index]": "index()"
    }
})
export class GridRowDirective {
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const selected = this.selected();
        return gridListTableRowThemeVariants(theme)({ selected });
    });

    public readonly index = input.required<number>();
    public readonly row = input.required<Row>();
    public readonly selected = input(false);
}
